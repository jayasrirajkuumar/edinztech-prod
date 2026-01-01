const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const OutsiderQuiz = require('../models/OutsiderQuiz');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
        await repairQuizzes();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const repairQuizzes = async () => {
    try {
        const quizzes = await OutsiderQuiz.find({});
        console.log(`Scanning ${quizzes.length} quizzes...`);

        for (const quiz of quizzes) {
            let modified = false;
            quiz.questions.forEach((q, idx) => {
                if (q.type === 'mcq' && q.correctOption === undefined) {
                    console.log(`Fixing Quiz "${quiz.title}" Q${idx + 1}: Missing correctOption. Setting to 0.`);
                    q.correctOption = 0;
                    modified = true;
                }
            });

            if (modified) {
                await quiz.save();
                console.log(`Saved Quiz "${quiz.title}".`);
            }
        }
        console.log('Repair Complete.');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

connectDB();
