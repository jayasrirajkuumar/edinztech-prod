const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// BYPASS 2DESH PROXY -> GO DIRECT TO META
const BASE_URL = 'https://graph.facebook.com';
const VERSION = 'v19.0';
const PHONE_ID = process.env.WA_PHONE_ID;
const ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN;
const RECIPIENT = '916382043432';

async function sendDirectToMeta() {
    if (!PHONE_ID || !ACCESS_TOKEN) return console.error("Missing Credentials");

    const url = `${BASE_URL}/${VERSION}/${PHONE_ID}/messages`;
    console.log(`\n--- Direct Meta API Test ---`);
    console.log(`URL: ${url}`);

    // Test with "hello_world" which is the universal test template
    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: RECIPIENT,
        type: "template",
        template: {
            name: "hello_world",
            language: { code: "en_US" }
        }
    };

    try {
        const res = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ SENT VIA META! ID: ${res.data.messages?.[0]?.id}`);
        console.log("If you receive this, the Token is valid but 2desh proxy was flaky.");
    } catch (err) {
        console.error(`❌ FAILED: ${err.message}`);
        if (err.response) {
            console.error(JSON.stringify(err.response.data, null, 2));
        }
    }
}

sendDirectToMeta();
