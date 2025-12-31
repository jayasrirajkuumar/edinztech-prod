
const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const baseURL = 'http://localhost:5000/api';

// We need a token. Let's try to login as admin first or hardcode if we know a user.
// Since we don't know a user password for sure, let's try to verify if server is reachable first.

async function test() {
    try {
        console.log('Testing Server Connectivity...');
        const rootRes = await axios.get('http://localhost:5000/');
        console.log('Server Root Response:', rootRes.data);

        // We need an admin token to create a quiz.
        // Let's check if we can simulate it or if we need to login.
        // I will try to login using the "System Admin" credentials if standard ones exist, or skip strict auth for a moment if I can't.
        // Actually, I can't easily guess the password. 
        // But I can check if the server crashes with a bad request even without auth? No, auth middleware runs first.

        // Let's simply check if the route exists and returns 401 instead of Network Error.
        console.log('Testing Create Quiz Route (Expect 401)...');
        try {
            await axios.post(`${baseURL}/outsider-quiz/admin`, {});
        } catch (e) {
            console.log('Route Status:', e.response ? e.response.status : e.message);
            if (e.response && e.response.status === 401) {
                console.log('Route is protected and reachable.');
            } else {
                // If it's network error, it will show here.
                throw e;
            }
        }

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('Server is likely DOWN.');
        }
    }
}

test();
