const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');

// Config
const MONGO_URI = 'mongodb://localhost:27017/edinztech_lms';
const JWT_SECRET = 'supersecret_jwt_key_make_this_complex';
const TEST_URL = 'http://localhost:5000/api/quiz/my-quizzes';

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('DB Connected');

        const user = await User.findOne({ email: 'assuvarcloud@gmail.com' });
        if (!user) throw new Error('User not found');

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
        console.log(`Generated Token for ${user.email}`);

        console.log(`Fetching: ${TEST_URL}`);
        try {
            const res = await axios.get(TEST_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`Status: ${res.status}`);
            console.log(`Data:`, JSON.stringify(res.data, null, 2));
        } catch (apiErr) {
            console.error('API Error:', apiErr.message);
            if (apiErr.response) {
                console.error('Response Status:', apiErr.response.status);
                console.error('Response Data:', apiErr.response.data);
            }
        }
    } catch (err) {
        console.error('Script Error:', err);
    } finally {
        mongoose.disconnect();
    }
};

run();
