
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.WA_API_KEY;
const CHANNEL_ID = '69209c252080629f90a4'; // Extracted from screenshot

async function testFetch() {
    console.log('Testing 2desh API Sync...');

    // Likely endpoints with Channel ID
    const endpoints = [
        `https://crmapi.2desh.com/api/v1/whatsapp/${CHANNEL_ID}/templates`,
        `https://crmapi.2desh.com/v1/whatsapp/${CHANNEL_ID}/templates`,
        `https://crmapi.2desh.com/channel/${CHANNEL_ID}/templates`,
        `https://crmapi.2desh.com/api/channel/${CHANNEL_ID}/templates`,
        `https://crmapi.2desh.com/templates?channelId=${CHANNEL_ID}`,
        // Try simple ones again with different casing
        'https://crmapi.2desh.com/template/get-all',
        'https://crmapi.2desh.com/message/templates'
    ];

    for (const url of endpoints) {
        console.log(`\n--- Trying: ${url} ---`);
        try {
            const res = await axios.get(url, {
                headers: {
                    'apikey': API_KEY,
                    'Authorization': API_KEY // Try both
                }
            });
            console.log(`STATUS: ${res.status}`);
            if (Array.isArray(res.data) || (res.data.data && Array.isArray(res.data.data))) {
                console.log('✅ SUCCESS!');
                console.log('SAMPLE:', JSON.stringify(res.data, null, 2).substring(0, 500));
                return;
            } else {
                console.log('Got response but not array:', typeof res.data);
            }
        } catch (err) {
            console.log(`❌ FAILED: ${err.message}`);
            if (err.response) {
                console.log(`   Status: ${err.response.status}`);
            }
        }
    }
}
testFetch();
