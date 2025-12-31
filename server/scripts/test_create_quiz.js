
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
        console.log('No admin found');
        process.exit(1);
    }

    console.log('Found Admin:', admin.email);

    // Generate Token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    console.log('Generated Token');

    // Payload mimicking frontend
    const payload = {
        title: "Test Quiz From Script",
        description: "Testing backend stability",
        timeLimit: 10,
        certificateTemplate: "", // Empty as typically sent before upload
        questions: [
            {
                questionText: "What is 2+2?",
                options: ["3", "4", "5", "6"],
                correctAnswer: "4",
                marks: 1
            }
        ]
    };

    try {
        const res = await axios.post('http://localhost:5000/api/outsider-quiz/admin', payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Quiz Created Successfully:', res.data._id);
    } catch (error) {
        console.log('Creation Failed:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
    }

    process.exit();
};

run();
