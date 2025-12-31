const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_URL = process.env.WA_PROVIDER_URL;
const VERSION = process.env.WA_API_VERSION;
const ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN;
const WABA_ID = process.env.WA_WABA_ID;

async function fetchTemplates() {
    if (!WABA_ID || !ACCESS_TOKEN) return console.error('Missing Credentials');

    // Endpoint: /{WABA_ID}/message_templates
    const url = `${BASE_URL}/${VERSION}/${WABA_ID}/message_templates`;

    console.log(`Fetching from: ${url}`);

    try {
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });

        console.log(`✅ Success! Found ${response.data.data?.length} templates.`);

        const target = response.data.data?.find(t => t.name.includes('dec_intern'));
        if (target) {
            console.log(`\n🎯 TARGET ANALYZED: "${target.name}"`);
            console.log('Status:', target.status);
            console.log('Language:', target.language);
            console.log('COMPONENTS:');
            target.components.forEach(c => {
                console.log(`  [${c.type}] Text: "${c.text}"`);
                if (c.example) console.log(`       Example: ${JSON.stringify(c.example)}`);
            });
        } else {
            console.log("dec_intern not found in list.");
            response.data.data?.forEach(t => console.log(`- ${t.name}`));
        }

    } catch (error) {
        console.error('❌ Failed to fetch templates:', error.message);
        if (error.response) {
            console.log('Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

fetchTemplates();
