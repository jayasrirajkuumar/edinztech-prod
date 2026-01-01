const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const OutsiderQuiz = require('../models/OutsiderQuiz');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
        await repairQuiz();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const repairQuiz = async () => {
    try {
        // Find by title partial match
        const quizzes = await OutsiderQuiz.find({ title: { $regex: 'dfhd', $options: 'i' } });
        console.log(`Found ${quizzes.length} matching quizzes.`);

        for (const quiz of quizzes) {
            console.log(`Repairing Quiz: ${quiz.title}`);
            quiz.questions.forEach((q, idx) => {
                console.log(`Q${idx + 1}: question="${q.question}", correctOption=${q.correctOption}`);

                if (q.type === 'mcq' && q.correctOption === undefined) {
                    console.log(`  Q${idx + 1}: Defaulting correctOption to 0`);
                    q.correctOption = 0;
                }

                if (!q.question) {
                    console.log(`  Q${idx + 1}: Missing question text. Setting default.`);
                    // Check if questionText exists in doc (if strict: false allowed it to load)
                    // access via ._doc if available or check keys
                    q.question = "Question " + (idx + 1);
                }
            });

            try {
                await quiz.save();
                console.log('  Success: Saved.');
            } catch (err) {
                console.error('  Failed to save:', err.message);
                if (err.errors) {
                    Object.keys(err.errors).forEach(key => {
                        console.error(`    ${key}: ${err.errors[key].message}`);
                    });
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
