const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const search = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const users = await User.find({ email: /karthiya/i }).select('+encryptedPassword');
        console.log(`Found ${users.length} users matching "karthiya":`);

        users.forEach(u => {
            console.log('------------------------------------------------');
            console.log(`ID: ${u._id}`);
            console.log(`Email: "${u.email}"`); // Quotes to reveal spaces
            console.log(`UserCode: ${u.userCode}`);
            console.log(`Created: ${u.createdAt}`);
            console.log(`EncryptedPwd: ${u.encryptedPassword ? 'EXISTS' : 'MISSING'}`);
        });

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

search();
