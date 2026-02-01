const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@edinztech.com';
const ADMIN_PASSWORD = 'admin123';
const TARGET_EMAIL = 'karthiya@inspiress.in';

const run = async () => {
    try {
        // 1. Login Admin
        console.log('Logging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/admin/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        const token = loginRes.data.token;
        console.log('Admin Logged In. Token:', token.substring(0, 10) + '...');

        // 2. Get Target User ID (Need to cheat and use DB check or search API)
        // Let's use the public "Check User" API if available, or just assume we know the ID from debug_user output?
        // Actually, easier to use Search Enrollments API as Admin
        console.log('Searching for target student...');
        const enrollRes = await axios.get(`${API_URL}/admin/enrollments?search=${TARGET_EMAIL}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const enrollment = enrollRes.data.find(e => e.email === TARGET_EMAIL);
        if (!enrollment) {
            console.error('Target student not found in enrollments!');
            return;
        }
        const studentId = enrollment.userId;
        console.log('Found Student ID:', studentId);

        // 3. Get Credentials
        console.log('Fetching Credentials...');
        try {
            const credsRes = await axios.post(`${API_URL}/admin/credentials`, {
                studentId: studentId,
                adminPassword: ADMIN_PASSWORD
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Credentials Response:', credsRes.data);
        } catch (err) {
            console.error('Credentials API Failed:', err.response?.status, err.response?.data);
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
};

run();
