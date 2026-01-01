require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const OutsiderQuizAttempt = require('../models/OutsiderQuizAttempt');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

const checkLeads = async () => {
    await connectDB();
    const count = await OutsiderQuizAttempt.countDocuments();
    console.log(`Total Outsider Quiz Attempts found: ${count}`);
    const latest = await OutsiderQuizAttempt.findOne().sort({ createdAt: -1 });
    if (latest) {
        console.log('Latest Attempt:', JSON.stringify(latest, null, 2));
    }
    process.exit();
};

checkLeads();
