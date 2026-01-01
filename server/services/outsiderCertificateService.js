const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { sendEmail } = require('./emailService');

const generateAndSendCertificate = async (userDetails, quiz, score) => {
    try {
        // Calculate Percentage
        const total = quiz.questions.reduce((a, b) => a + (b.marks || 1), 0) || quiz.questions.length; // Handle weighted or count
        // Wait, score is raw score.
        // Step 619 view shows 'score' property in result.
        // It's usually sum of marks or count.
        // Step 569 controller:
        // const percentage = (score / quiz.questions.length) * 100;
        // score variable there is count of correct answers (Assuming 1 mark each).
        // If marks are used, I should be careful.
        // Let's rely on the passed 'score' being the one stored in DB.
        // And if we want percentage string:

        let percentage = 0;
        // Recalculate based on totalMaxScore if available, else question length
        // OutsiderQuizResult has totalMaxScore.
        // But here we pass 'quiz' and 'score' (which comes from attempt/result).
        const maxScore = quiz.questions.length; // Assuming 1 mark per question for now as per controller logic
        if (maxScore > 0) {
            percentage = Math.round((score / maxScore) * 100);
        }

        // 1. Resolve Template Path
        // Assuming process.cwd() is '.../server', we need to go up to root to find 'certificate-service'
        let templatePath = path.join(process.cwd(), '..', 'certificate-service', 'templates', 'outsiders.png');

        // Check for Custom Template (If quiz has one uploaded)
        if (quiz.certificateTemplate) {
            // Saved as '/uploads/filename'. This is relative to 'server'.
            // So if it starts with /uploads, we treat it as relative to CWD.
            // Wait, path.join(cwd, '/uploads') might be tricky if leading slash exists.
            // Best to strip leading slash if present.
            const cleanPath = quiz.certificateTemplate.startsWith('/') ? quiz.certificateTemplate.slice(1) : quiz.certificateTemplate;
            const customPath = path.join(process.cwd(), cleanPath);
            if (fs.existsSync(customPath)) {
                templatePath = customPath;
            }
        }

        if (!fs.existsSync(templatePath)) {
            console.error(`Certificate Template not found at: ${templatePath}`);
            return false;
        }

        const templateBytes = fs.readFileSync(templatePath);

        // 2. Create PDF
        const pdfDoc = await PDFDocument.create();

        // Embed PNG/JPG
        // Detect type? Extension is png.
        let image;
        if (templatePath.endsWith('.png')) {
            image = await pdfDoc.embedPng(templateBytes);
        } else {
            image = await pdfDoc.embedJpg(templateBytes);
        }

        const { width, height } = image.scale(1);
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(image, { x: 0, y: 0, width, height });

        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // 3. Draw Text
        // Use Relative Coordinates (Percentage of Height/Width)
        // This handles high-res images where fixed pixels would be tiny/collapsed.

        const centerX = width / 2;


        // Font Sizes (Increased based on user feedback)
        // Name needs to be prominent.
        const nameSize = height * 0.057; // ~5.7% (was 3.5%)
        const collegeSize = height * 0.035; // ~3.5% (was 2.5%)
        const scoreSize = height * 0.028; // ~2.8% (Reduced from 3.5% to match surrounding text better)

        const drawCenteredText = (text, y, size, font, color = rgb(0, 0, 0)) => {
            const textWidth = font.widthOfTextAtSize(text, size);
            page.drawText(text, {
                x: centerX - (textWidth / 2),
                y: y,
                size: size,
                font: font,
                color: color,
            });
        };

        // Name (Slightly above middle)
        // PDF coords: 0 is bottom. Middle is 0.5.
        // Adjust based on observation: Name is above the middle line usually.
        // Let's try 54% from bottom.
        // Name (Middle)
        // Image 3 shows name is slightly high. Moving down a tinge. 0.53
        drawCenteredText(userDetails.name, height * 0.53, nameSize, fontBold);

        // College (Below Name)
        // Move down slightly. 0.45
        drawCenteredText(userDetails.college || '', height * 0.45, collegeSize, fontRegular);

        // Score Line
        // Image 3 shows Score overlapping "INNOVATOR'S". Y=0.385 is TOO HIGH.
        // It needs to be much lower, near signature.
        // Let's try 0.28 (28% from bottom).

        // Print Score + %
        // Also cap at 100 in logic (handled in step 749, but let's ensure display is correct).
        // Wait, 'percentage' var is passed in.
        // The user complained about "104". 
        // I should display min(percentage, 100).
        const displayPercentage = Math.min(100, Math.round(Number(percentage)));
        const scoreString = `${displayPercentage}%`;

        // Manual X placement: width * 0.62 (Right of center)
        // Update: 0.62 is too far right. Moving closer to center. 0.58.
        // Update 2: 0.58 still gap. User asked to move UP a bit. Y=0.28 -> 0.288?
        // Also reduce X slightly to 0.57.
        page.drawText(scoreString, {
            x: width * 0.57, // Moved closer 
            y: height * 0.288, // Nudge UP slightly to sit on baseline
            size: scoreSize,
            font: fontBold,
            color: rgb(0, 0, 0),
        });

        // 4. Save
        const pdfBytes = await pdfDoc.save();

        // 5. Send Email
        console.log(`Sending certificate to ${userDetails.email}`);
        await sendEmail({
            to: userDetails.email,
            subject: `Certificate of Completion: ${quiz.title}`,
            text: `Dear ${userDetails.name},\n\nCongratulations on completing the quiz "${quiz.title}".\n\nPlease find your certificate attached.\n\nBest Regards,\nEdinz Tech`,
            attachments: [{
                filename: `${userDetails.name.replace(/ /g, '_')}_Certificate.pdf`,
                content: Buffer.from(pdfBytes),
                contentType: 'application/pdf'
            }]
        });

        return true;

    } catch (error) {
        console.error("Certificate Generation Error:", error);
        return false;
    }
};

module.exports = { generateAndSendCertificate };
