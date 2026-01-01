const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const OutsiderQuiz = require('../models/OutsiderQuiz');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
        await debugQuizzes();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const debugQuizzes = async () => {
    try {
        const quizzes = await OutsiderQuiz.find({});
        console.log('Total Quizzes:', quizzes.length);
        console.log(JSON.stringify(quizzes, null, 2));
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

connectDB();
