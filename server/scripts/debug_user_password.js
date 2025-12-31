const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const checkUser = async () => {
    await connectDB();
    const email = 'team@assuvar.com'; // From new screenshot

    // Explicitly select encryptedPassword to check if it exists in DB
    const user = await User.findOne({ email }).select('+encryptedPassword');

    if (!user) {
        console.log('User not found!');
    } else {
        console.log(`User Found: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`EncryptedPassword Field Exists? ${user.encryptedPassword ? 'YES' : 'NO'}`);
        if (user.encryptedPassword) {
            console.log(`EncryptedPassword Length: ${user.encryptedPassword.length}`);
        } else {
            console.log('Reason for "Not Available": Record implies old user without stored reversible password.');
        }
    }
    process.exit();
};

checkUser();
