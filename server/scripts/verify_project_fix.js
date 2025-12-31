const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const User = require('../models/User'); // Dummy user needed
const Program = require('../models/Program'); // Dummy program needed
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        // 1. Create Dummy User
        const user = await User.create({
            name: 'Schema Test',
            email: `schema_test_${Date.now()}@test.com`,
            password: 'password',
            role: 'student'
        });
        console.log("✅ Dummy User Created:", user._id);

        // 2. Create Dummy Project Program
        const program = await Program.create({
            title: 'Test Project',
            type: 'Project', // CRITICAL
            mode: 'Online',
            startDate: new Date(),
            endDate: new Date()
        });
        console.log("✅ Dummy Project Program Created:", program._id);

        // 3. Try to Create Payment with 'Project' type
        const payment = await Payment.create({
            razorpayOrderId: 'rzp_test',
            razorpayPaymentId: 'pay_test_' + Date.now(),
            user: user._id,
            program: program._id,
            programType: 'Project', // CRITICAL
            amount: 500,
            status: 'captured'
        });
        console.log("✅ Payment Created with type 'Project':", payment._id);

        // 4. Try to Create Enrollment with 'Project' type
        const enrollment = await Enrollment.create({
            user: user._id,
            program: program._id,
            programType: 'Project', // CRITICAL - This whas causing the error
            status: 'active',
            source: 'razorpay'
        });
        console.log("✅ Enrollment Created with type 'Project':", enrollment._id);

        console.log("🎉 SUCCESS: Projects are now supported in the Schema!");

        // Cleanup
        await User.findByIdAndDelete(user._id);
        await Program.findByIdAndDelete(program._id);
        await Payment.findByIdAndDelete(payment._id);
        await Enrollment.findByIdAndDelete(enrollment._id);

    } catch (err) {
        console.error("❌ Schema Verification Failed:", err.message);
        if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    } finally {
        await mongoose.disconnect();
    }
}

run();
