const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_URL = process.env.WA_PROVIDER_URL; // https://crmapi.2desh.com/api/meta
const VERSION = process.env.WA_API_VERSION || 'v19.0';
const PHONE_ID = process.env.WA_PHONE_ID;
const ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN;
const RECIPIENT = '916382043432';

async function sendTest(templateName, variables = []) {
    if (!PHONE_ID || !ACCESS_TOKEN) return console.error("Missing Credentials");

    const url = `${BASE_URL}/${VERSION}/${PHONE_ID}/messages`;
    console.log(`\n--- Testing Template: "${templateName}" ---`);

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: RECIPIENT,
        type: "template",
        template: {
            name: templateName,
            language: { code: "en" },
            components: [
                {
                    type: "body",
                    parameters: variables.map(v => ({ type: "text", text: v }))
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
        console.log("Check your phone now.");
    } catch (err) {
        console.error(`❌ FAILED: ${err.message}`);
        if (err.response) {
            console.error(JSON.stringify(err.response.data, null, 2));
        }
    }
}

async function runTests() {
    console.log("Starting Delivery Tests...");

    // Test 1: Standard Format (snake_case)
    await sendTest('dec_intern');

    // Test 2: Raw Format (with space, if UI showed "dec intern")
    // Note: Meta typically rejects spaces, but 2desh might map it.
    await sendTest('dec intern');

    // Test 3: Common Default (hello_world) - Most accounts have this
    await sendTest('hello_world');
}

runTests();
