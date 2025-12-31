const mongoose = require('mongoose');
const dotenv = require('dotenv');
const WhatsAppTemplate = require('../models/WhatsAppTemplate');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const templates = [
            {
                name: 'welcome_message_v1',
                description: 'Standard welcome message for new enrollments',
                variables: ['1', '2'], // 1: Student Name, 2: Program Title
                status: 'Active',
                bodyPreview: 'Hello {{1}}, welcome to {{2}}. We are excited to have you!'
            },
            {
                name: 'payment_confirmation',
                description: 'Sent after successful payment',
                variables: ['1'], // 1: Amount
                status: 'Active',
                bodyPreview: 'Payment of Rs.{{1}} received. Thank you!'
            }
        ];

        for (const t of templates) {
            const exists = await WhatsAppTemplate.findOne({ name: t.name });
            if (!exists) {
                await WhatsAppTemplate.create(t);
                console.log(`Created template: ${t.name}`);
            } else {
                console.log(`Template already exists: ${t.name}`);
            }
        }

        console.log('Seeding Complete');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seed();
