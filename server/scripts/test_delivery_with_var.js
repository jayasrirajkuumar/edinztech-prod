const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_URL = process.env.WA_PROVIDER_URL;
const VERSION = process.env.WA_API_VERSION || 'v19.0';
const PHONE_ID = process.env.WA_PHONE_ID;
const ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN;
const RECIPIENT = '916382043432';

async function sendTest() {
    if (!PHONE_ID || !ACCESS_TOKEN) return console.error("Missing Credentials");

    const url = `${BASE_URL}/${VERSION}/${PHONE_ID}/messages`;
    console.log(`\n--- Sending 'dec_intern' with Variable ---`);

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: RECIPIENT,
        type: "template",
        template: {
            name: "dec_intern",
            language: { code: "en" },
            components: [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: "January 2025" } // The missing variable!
                    ]
                }
            ]
        }
    };

    try {
        const res = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ SENT! ID: ${res.data.messages?.[0]?.id}`);
    } catch (err) {
        console.error(`❌ FAILED: ${err.message}`);
        if (err.response) console.error(JSON.stringify(err.response.data, null, 2));
    }
}

sendTest();
