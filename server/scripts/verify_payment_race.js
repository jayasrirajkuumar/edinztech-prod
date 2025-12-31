const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const API_URL = `http://localhost:${process.env.PORT || 5000}/api`;
const SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

async function runTest() {
    try {
        console.log("🔍 Fetching programs...");
        const progRes = await axios.get(`${API_URL}/programs`);
        const programs = progRes.data;
        const paidProgram = programs.find(p => p.mode === 'Paid' || (p.fee && p.fee > 0));

        if (!paidProgram) {
            console.error("❌ No paid programs found to test with.");
            return;
        }

        console.log(`✅ Using Program: ${paidProgram.title} (${paidProgram._id})`);

        // Test Data
        const timestamp = Date.now();
        const email = `race_test_${timestamp}@example.com`;
        const phone = '9999999999';
        const name = `Test User ${timestamp}`;

        const orderId = `order_${timestamp}`;
        const paymentId = `pay_${timestamp}`;

        console.log(`🚀 Starting Race Condition Test for: ${email}`);
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Payment ID: ${paymentId}`);

        // --- Prepare Payloads ---

        // 1. Verify Payment Payload
        const verifyPayload = {
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: crypto.createHmac('sha256', SECRET)
                .update(orderId + "|" + paymentId)
                .digest('hex')
        };
        // NOTE: The verify endpoint attempts to fetch Order from Razorpay API. 
        // Since this orderId is fake, it will fail with "Order not found" on backend UNLESS we mock it 
        // OR the backend robustly handles it.
        // Wait, the backend calls `razorpay.orders.fetch(razorpay_order_id)`.
        // This test will fail because 'order_timestamp' does not exist on Razorpay.

        // CORRECTION: I cannot simulate success completely without a REAL Razorpay order.
        // HOWEVER, the race condition happens at User creation which is BEFORE order fetch?
        // Let's check paymentController.js
        // verifyPayment -> check signature -> fetch order -> extract notes.

        // IF I cannot fetch order, I cannot extract notes, so I cannot create User.
        // So `verifyPayment` will fail on `order not found`.

        // BUT Webhook receives payload directly. 
        // `handleWebhook` uses `req.body.payload`. It does NOT fetch from Razorpay.
        // So I can simulate webhook success.

        // To simulate `verifyPayment`, I might need to bypass order fetch or mocked it.
        // But since I can't modify backend heavily, maybe I can only rely on the code fix I made.

        console.log("⚠️  Limitation: Cannot verify manual flow without real Razorpay Order ID.");
        console.log("    Simulating double WEBHOOK hit instead to test idempotent User/Enrollment creation.");

        // 2. Webhook Payload
        const webhookPayload = {
            entity: 'event',
            account_id: 'acc_test',
            event: 'payment.captured',
            contains: ['payment'],
            payload: {
                payment: {
                    entity: {
                        id: paymentId,
                        entity: 'payment',
                        amount: 50000,
                        currency: 'INR',
                        status: 'captured',
                        order_id: orderId,
                        email: email,
                        contact: phone,
                        notes: {
                            programId: paidProgram._id,
                            programType: paidProgram.type || 'Course',
                            email: email,
                            phone: phone,
                            name: name
                        }
                    }
                }
            }
        };

        const webhookBody = JSON.stringify(webhookPayload);
        const webhookSignature = crypto.createHmac('sha256', WEBHOOK_SECRET)
            .update(webhookBody)
            .digest('hex');

        // Fire Two Webhooks Concurrently
        console.log("🔥 Firing 2 concurrent Webhooks...");

        const req1 = axios.post(`${API_URL}/payments/webhook`, webhookPayload, {
            headers: { 'x-razorpay-signature': webhookSignature }
        });

        const req2 = axios.post(`${API_URL}/payments/webhook`, webhookPayload, {
            headers: { 'x-razorpay-signature': webhookSignature }
        });

        const [res1, res2] = await Promise.allSettled([req1, req2]);

        console.log("--- Results ---");
        const logRes = (r, i) => {
            if (r.status === 'fulfilled') console.log(`Req ${i}: ✅ ${r.value.status} ${r.value.data?.status}`);
            else console.log(`Req ${i}: ❌ ${r.reason.message} | Data: ${JSON.stringify(r.reason.response?.data)}`);
        };
        logRes(res1, 1);
        logRes(res2, 2);

        if (res1.status === 'fulfilled' && res2.status === 'fulfilled') {
            console.log("✅ SUCCESS: Both requests handled gracefully.");
        } else {
            console.log("❌ FAILURE: One or more requests failed.");
        }

    } catch (err) {
        console.error("Test Error:", err.message);
        if (err.response) {
            console.error("Response:", err.response.data);
        }
    }
}

runTest();
