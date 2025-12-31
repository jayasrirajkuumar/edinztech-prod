const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const QuizSchema = new mongoose.Schema({}, { strict: false });
const Quiz = mongoose.model('Quiz', QuizSchema);

const run = async () => {
    await connectDB();

    try {
        console.log('\n--- EXTENDED QUIZ DEBUG ---');
        // Find recent quizzes
        const quizzes = await Quiz.find().sort({ _id: -1 }).limit(5);

        quizzes.forEach(q => {
            console.log(`\nQuiz: '${q.title}' (ID: ${q._id})`);
            console.log(` - Status: ${q.status}`);
            console.log(` - Program ID: ${q.program}`);
            console.log(` - Start Time: ${q.startTime}`);
            console.log(` - End Time: ${q.endTime}`);
            console.log(` - Questions Count: ${q.questions ? q.questions.length : 0}`);

            if (q.questions && q.questions.length > 0) {
                console.log(` - Sample Q1: ${JSON.stringify(q.questions[0].question)}`);
            } else {
                console.log(' - WARNING: ZERO QUESTIONS DETECTED');
            }
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
};

run();
