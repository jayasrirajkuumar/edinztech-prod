const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const OutsiderQuiz = require('../models/OutsiderQuiz');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
        await validateQuizzes();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const validateQuizzes = async () => {
    try {
        const quizzes = await OutsiderQuiz.find({});
        console.log(`Found ${quizzes.length} quizzes.`);

        for (const quiz of quizzes) {
            console.log(`Checking Quiz: ${quiz.title} (${quiz._id})`);

            // Try explicit validation
            try {
                await quiz.validate();
                console.log('  Validation Passed.');
            } catch (err) {
                console.error('  Validation FAILED:');
                if (err.errors) {
                    Object.keys(err.errors).forEach(key => {
                        console.error(`    - ${key}: ${err.errors[key].message}`);
                    });
                } else {
                    console.error(err);
                }
            }
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

connectDB();
