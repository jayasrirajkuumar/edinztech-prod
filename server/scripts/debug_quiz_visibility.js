const mongoose = require('mongoose');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const Program = require('../models/Program');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const debugQuizVisibility = async () => {
    await connectDB();

    try {
        // 1. Find the user
        const userEmail = 'assuvarcloud@gmail.com'; // CORRECT email from screenshot
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            console.log(`User ${userEmail} not found!`);
            // Try finding by user code if needed
            const userByCode = await User.findOne({ userCode: '1EBEFC' });
            if (userByCode) {
                console.log(`Found user by Code: ${userByCode.email} (${userByCode._id})`);
                // use this user
            } else {
                process.exit(1);
            }
        } else {
            console.log(`User Found: ${user.email} (${user._id})`);
        }

        const targetUser = user || (await User.findOne({ userCode: '1EBEFC' }));
        if (!targetUser) return;

        // SIMULATE getStudentQuizzes
        console.log('\n--- SIMULATING CONTROLLER LOGIC ---');
        const enrollments = await Enrollment.find({ user: targetUser._id, status: 'active' });
        const programIds = enrollments.map(e => e.program);

        console.log(`Found ${enrollments.length} active enrollments.`);
        console.log(`Program IDs:`, programIds);

        const quizzes = await Quiz.find({
            program: { $in: programIds },
            status: 'Published'
        }).populate('program', 'title').sort({ startTime: 1 });

        console.log(`Query Result: Found ${quizzes.length} Quizzes.`);
        quizzes.forEach(q => {
            console.log(` - [${q.status}] ${q.title} (Program: ${q.program ? q.program.title : '?'})`);
        });

        console.log('\n--- ALL QUIZZES (Debug) ---');
        const allQuizzes = await Quiz.find({});
        allQuizzes.forEach(q => {
            console.log(`Title: ${q.title}, Status: ${q.status}, Program: ${q.program}`);
        });

    } catch (error) {
        console.error("Debug Error:", error);
    } finally {
        mongoose.connection.close();
    }
};

debugQuizVisibility();
