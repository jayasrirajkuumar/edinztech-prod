const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PHONE_ID = process.env.WA_PHONE_ID;
const ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN;
const BASE_URL = process.env.WA_PROVIDER_URL || 'https://crmapi.2desh.com/api/meta';
const VERSION = process.env.WA_API_VERSION || 'v19.0';

// User's number from logs
const RECIPIENT = '916382043432';
const TEMPLATE_NAME = 'dec_intern'; // Using the one we know exists

async function testConnection() {
    console.log('--- Config Check ---');
    console.log('Provider URL:', BASE_URL);
    console.log('Phone ID:', PHONE_ID);
    console.log('Token Length:', ACCESS_TOKEN ? ACCESS_TOKEN.length : 'MISSING');

    if (!PHONE_ID || !ACCESS_TOKEN) {
        console.error('❌ Missing Credentials in .env');
        return;
    }

    const url = `${BASE_URL}/${VERSION}/${PHONE_ID}/messages`;

    // Meta Cloud API Payload
    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: RECIPIENT,
        type: "template",
        template: {
            name: TEMPLATE_NAME,
            language: { code: "en" },
            components: [
                {
                    type: "body",
                    parameters: [] // dec_intern has no vars? 
                    // If it has vars, this might fail with "param mismatch", but that confirms Auth works!
                }
            ]
        }
    };

    try {
        console.log(`\n🚀 Sending Test Message to ${RECIPIENT}...`);
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ SUCCESS! API Responded:');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ FAILED:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testConnection();
