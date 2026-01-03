const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Program = require('../models/Program');

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

    // ID from screenshot
    const id = '6957f42aecbd08f7064c9f46';
    try {
        const program = await Program.findById(id);
        if (program) {
            console.log('--- PROGRAM DEBUG ---');
            console.log(`ID: ${program._id}`);
            console.log(`Title: ${program.title}`);
            console.log(`Certificate Template: '${program.certificateTemplate}'`);
            console.log(`Offer Letter Template: '${program.offerLetterTemplate}'`);
            console.log('---------------------');
        } else {
            console.log('Program not found with ID:', id);
            // List all to check if ID is wrong
            const all = await Program.find().limit(5);
            console.log('First 5 programs:', all.map(p => `${p._id} : ${p.title} : ${p.certificateTemplate}`));
        }
    } catch (e) {
        console.error(e);
    }
    process.exit();
};

run();
