const axios = require('axios');
require('dotenv').config({ path: '.env' });

const API_KEY = process.env.WA_API_KEY;
const PHONE = '916382043432'; // User's test number
const BASE_URL = 'https://crmapi.2desh.com';

const endpoints = [
    '/message/send',
    '/api/message/send',
    '/v1/message/send',
    '/api/v1/message/send',
    '/whatsapp/send',
    '/api/whatsapp/send',
    '/send-template',
    '/api/send-template',
    '/api/v1/sendTemplate',
    '/template/send',
    '/api/template/send'
];

const payload = {
    phone: PHONE,
    template_name: 'dec_intern',
    variables: [],
    language: 'en'
};

/* Some APIs expect 'number' instead of 'phone', or 'template' instead of 'template_name' */
const alternatePayload = {
    number: PHONE,
    template: 'dec_intern',
    parameters: []
};

async function probe() {
    console.log(`Probing 2desh API with Key: ${API_KEY ? 'Present' : 'Missing'}`);

    for (const path of endpoints) {
        const url = `${BASE_URL}${path}`;
        try {
            console.log(`Trying POST ${url}...`);
            // Try standard payload
            await axios.post(url, payload, { headers: { 'Authorization': API_KEY } });
            console.log(`✅ SUCCESS [Standard Payload] at ${url}`);
            return;
        } catch (error) {
            if (error.response) {
                if (error.response.status !== 404) {
                    console.log(`⚠️  ${url} returned ${error.response.status} (Not 404!) - Might be the one.`);
                    console.log('Response:', error.response.data);
                }
            } else {
                console.log(`❌ Error at ${url}: ${error.message}`);
            }
        }
    }
}

probe();
