const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const path = require('path');
const { decrypt } = require('../utils/encryption');

dotenv.config({ path: path.join(__dirname, '../.env') });

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const email = 'karthiya@inspiress.in';
        const user = await User.findOne({ email }).select('+password +encryptedPassword');

        if (!user) {
            console.log('User not found');
        } else {
            console.log('User Found:', user._id);
            console.log('Email:', user.email);
            console.log('Created At:', user.createdAt);
            console.log('Password (Hash):', user.password ? 'Exists' : 'Missing');
            console.log('EncryptedPassword (Raw):', user.encryptedPassword);

            if (user.encryptedPassword) {
                try {
                    const decrypted = decrypt(user.encryptedPassword);
                    console.log('Decrypted Password:', decrypted);
                } catch (e) {
                    console.log('Decryption Failed:', e.message);
                }
            } else {
                console.log('EncryptedPassword is NULL/Undefined');
            }
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

inspect();
