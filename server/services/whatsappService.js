const axios = require('axios');
const WhatsAppTemplate = require('../models/WhatsAppTemplate');

// --- Provider Abstraction: Meta Cloud API Proxy (via 2desh) ---
const metaProxyProvider = {
    name: '2desh-meta',
    sendMessage: async (payload) => {
        // Config from .env
        const baseUrl = process.env.WA_PROVIDER_URL || 'https://crmapi.2desh.com/api/meta';
        const version = process.env.WA_API_VERSION || 'v19.0';
        const phoneId = process.env.WA_PHONE_ID; // From Screenshot: 874225692444292
        const accessToken = process.env.WA_ACCESS_TOKEN; // Long JWT

        if (!phoneId || !accessToken) {
            console.error('[WA Service] ❌ Missing WA_PHONE_ID or WA_ACCESS_TOKEN in .env');
            return { success: false, error: 'Missing Configuration' };
        }

        const url = `${baseUrl}/${version}/${phoneId}/messages`;

        console.log(`[WA Service] 🚀 Sending via Meta API to ${payload.to} | Tpl: ${payload.template.name}`);
        // console.log(`[WA Service] Payload:`, JSON.stringify(payload)); // Debug only

        try {
            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            // 2desh Response Format Validation
            const msgId = response.data.messages?.[0]?.id || response.data.message?.queue_id || 'unknown';
            console.log(`[WA Service] ✅ Success: MsgID ${msgId}`);
            return { success: true, apiResponse: response.data };
        } catch (error) {
            console.error(`[WA Service] ❌ HTTP Error: ${error.message}`);
            if (error.response) {
                console.error('[WA Service] Response Dump:', JSON.stringify(error.response.data));
            }
            return { success: false, error: error.message };
        }
    },
    async fetchTemplates() {
        // Config
        const baseUrl = process.env.WA_PROVIDER_URL || 'https://crmapi.2desh.com/api/meta';
        const version = process.env.WA_API_VERSION || 'v19.0';
        const wabaId = process.env.WA_WABA_ID;
        const accessToken = process.env.WA_ACCESS_TOKEN;

        if (!wabaId || !accessToken) {
            console.warn('[WA Service] ⚠️ Cannot fetch templates: WA_WABA_ID or WA_ACCESS_TOKEN missing');
            return [];
        }

        const url = `${baseUrl}/${version}/${wabaId}/message_templates`;
        console.log(`[WA Service] 🔄 Fetching templates from: ${url}`);

        try {
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = response.data.data || [];

            // Normalize for Registry
            return data.map(t => {
                // Heuristic: Count {{x}} in body text OR parameters/example in components
                let varCount = 0;
                let bodyText = '';

                t.components?.forEach(c => {
                    if (c.type === 'BODY') {
                        bodyText = c.text;
                        // Better check: does it have example body_text?
                        if (c.example?.body_text?.[0]) {
                            varCount = c.example.body_text[0].length;
                        } else {
                            // Fallback regex count {{1}}
                            const matches = c.text.match(/\{\{\d+\}\}/g);
                            if (matches) varCount = new Set(matches).size;
                        }
                    }
                });

                // Generate variable placeholders
                const variables = Array.from({ length: varCount }, (_, i) => String(i + 1)); // ["1", "2"]

                return {
                    name: t.name,
                    status: t.status,
                    language: t.language,
                    variables: variables,
                    externalId: t.id
                };
            });

        } catch (error) {
            console.error(`[WA Service] ❌ Fetch Templates Error: ${error.message}`);
            if (error.response) console.error('[WA Service] Data:', JSON.stringify(error.response.data));
            return [];
        }
    }
};

// Registry
const currentProvider = metaProxyProvider;

/*
 * Resolves template and mapping, then delegates to Provider.
 */
const sendTemplate = async (user, program, eventType) => {
    const contextId = `User:${user._id}|Prog:${program._id}|Event:${eventType}`;

    try {
        // 1. Validate Context
        if (!user || !user.phone) return;

        const config = program.whatsappConfig?.[eventType];

        // 1. Check for Legacy Fallback first if New Config is NOT enabled
        if ((!config || !config.enabled) && eventType === 'onEnrolled' && program.whatsappMessage) {
            console.log(`[WA Legacy] Sending to ${user.phone}`);
            return true;
        }

        // 2. Validate New Config
        if (!config || !config.enabled) return; // Silent skip

        if (!config.templateId) {
            console.warn(`[WA Service] Config enabled but missing templateId for ${contextId}`);
            return;
        }

        // 2. Fetch Template
        const template = await WhatsAppTemplate.findById(config.templateId);
        if (!template) {
            console.warn(`[WA Service] Template not found (ID: ${config.templateId})`);
            return;
        }

        // 3. Resolve Variables (Meta API requires "body values" as a flat list of text parameters)
        // Note: Meta Template Params are positional {{1}}, {{2}}...
        const variableValues = [];
        if (config.variableMapping) {
            const mapping = config.variableMapping instanceof Map
                ? Object.fromEntries(config.variableMapping)
                : config.variableMapping;

            // We need to map them in order 1, 2, 3...
            // Assuming the UI maps keys "1", "2" etc.
            const keys = Object.keys(mapping).sort((a, b) => parseInt(a) - parseInt(b));

            for (const key of keys) {
                const dataPath = mapping[key];
                // Runtime safety
                const value = resolveDataPath(dataPath, { student: user, program }) || '';
                variableValues.push(value);
            }
        }

        // 4. Construct Payload (Meta Cloud API Standard)
        // SANITIZE PHONE: Ensure 91 prefix for India
        let phone = String(user.phone).replace(/\D/g, '');
        if (phone.startsWith('0')) phone = phone.substring(1);
        if (phone.length === 10) phone = '91' + phone;

        const apiPayload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phone,
            type: "template",
            template: {
                name: template.name,
                language: { code: template.language || "en" }, // User reg language
                components: [
                    {
                        type: "body",
                        parameters: variableValues.map(val => ({
                            type: "text",
                            text: String(val)
                        }))
                    }
                ]
            }
        };

        // 5. Delegate to Provider
        const result = await currentProvider.sendMessage(apiPayload);
        return result;

    } catch (error) {
        console.error(`[WA Service] ❌ Failed logic for ${contextId}:`, error.message);
        return false;
    }
};

// Helper: Resolve "student.name" from data object
const resolveDataPath = (path, data) => {
    if (!path) return '';
    try {
        return path.split('.').reduce((obj, key) => obj && obj[key], data);
    } catch (e) {
        return '';
    }
};

module.exports = {
    sendTemplate,
    syncTemplates: currentProvider.fetchTemplates
};
