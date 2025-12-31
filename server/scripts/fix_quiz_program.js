const mongoose = require('mongoose');
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

const fixQuiz = async () => {
    await connectDB();

    try {
        // 1. Find the target program 'haaha'
        // Using partial match or precise match based on user's screenshot
        const program = await Program.findOne({ title: { $regex: 'haaha', $options: 'i' } });
        if (!program) {
            console.log("Program 'haaha' not found!");
            return;
        }
        console.log(`Found Target Program: ${program.title} (${program._id})`);

        // 2. Find the quiz (The only published one, or specifically 'ghchv')
        // In this case, we know it's the one not showing up.
        const quiz = await Quiz.findOne({ status: 'Published' });

        if (!quiz) {
            console.log("No published quiz found.");
            return;
        }

        console.log(`Found Quiz: '${quiz.title}' currently computed to Program ID: ${quiz.program}`);

        // 3. Update
        quiz.program = program._id;
        await quiz.save();

        console.log(`SUCCESS: Reassigned Quiz '${quiz.title}' to Program '${program.title}'`);

    } catch (error) {
        console.error("Fix Error:", error);
    } finally {
        mongoose.connection.close();
    }
};

fixQuiz();
