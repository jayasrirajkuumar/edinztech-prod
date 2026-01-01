const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const mammoth = require('mammoth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

// transporter configuration
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Serve static files
app.use('/files', express.static(path.join(__dirname, 'temp')));

app.post('/api/generate', async (req, res) => {
    console.log('[Certificate Service] Received request');
    const { studentData, courseData, certificateId, callbackUrl, templateId, templateUrl, type, qrCode, date } = req.body;

    if (!studentData || !certificateId || !callbackUrl) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // SYNCHRONOUS PROCESSING (Atomic Requirement)
    try {
        await processCertificate({ studentData, courseData, certificateId, callbackUrl, templateId, templateUrl, type, qrCode, date });
        res.status(200).json({ success: true, message: 'Certificate Generated & Sent' });
    } catch (error) {
        console.error("Generation Failed:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

async function processCertificate({ studentData, courseData, certificateId, callbackUrl, templateId, templateUrl, type, qrCode, date }) {
    console.log(`[Processing] ${type || 'Certificate'}: ${certificateId} for ${studentData.name}`);
    let filePath = path.join(tempDir, `${certificateId}.pdf`);

    try {
        const isOfferLetter = type === 'offer-letter';
        const isAcceptance = type === 'acceptance-letter';

        // 1. Resolve Template Path
        let templatePath = null;
        let isDocx = false;

        // A. Try User Provided Template URL
        if (templateUrl) {
            // Normalize path (server sends 'uploads/file.docx' or similar)
            const cleanUrl = templateUrl.replace(/\\/g, '/');
            let relativePath;

            // Adjust path to reach server/uploads from certificate-service
            if (cleanUrl.startsWith('uploads/')) {
                relativePath = path.join('..', 'server', cleanUrl);
            } else {
                relativePath = path.join('..', 'server', 'uploads', cleanUrl);
            }

            const absPath = path.resolve(__dirname, relativePath);

            if (fs.existsSync(absPath)) {
                templatePath = absPath;
                isDocx = templatePath.toLowerCase().endsWith('.docx') || templatePath.toLowerCase().endsWith('.doc');
            } else {
                console.warn(`[Warning] Provided template not found at ${absPath} (URL: ${templateUrl})`);
            }
        }

        // B. Fallback to Local Defaults (Only if no user template found)
        if (!templatePath) {
            const templatesDir = path.join(__dirname, 'templates');

            // Explicit Template Mapping based on templateId (Only for Offer/Acceptance Letters)
            if ((isOfferLetter || isAcceptance) && templateId) {
                if (templateId === 'ats') {
                    templatePath = path.join(templatesDir, 'ats.png');
                } else if (templateId === 'inspire') {
                    templatePath = path.join(templatesDir, 'inspire.png');
                } else if (templateId === 'igreen') {
                    templatePath = path.join(templatesDir, 'igreen.png');
                } else if (templateId === 'edinz') {
                    templatePath = path.join(templatesDir, 'edinz.png');
                }
            }

            // Fallbacks for Offer/Acceptance specific defaults
            else if (isOfferLetter || isAcceptance) {
                if (fs.existsSync(path.join(templatesDir, 'offer-letter.png'))) {
                    templatePath = path.join(templatesDir, 'offer-letter.png');
                } else {
                    templatePath = path.join(templatesDir, 'edinz.png');
                }
            } else {
                // Standard Certificate Default
                templatePath = path.join(templatesDir, 'default.jpg');
            }
            console.log(`[Template] Selected Local Template: ${templatePath}`);
        }

        console.log(`[Template] Using: ${templatePath} (Docx: ${isDocx})`);

        let htmlContent = '';

        if (isDocx) {
            // --- DOCX PROCESSING WITH AUTO-REPAIR ---
            const content = fs.readFileSync(templatePath, 'binary');
            const zip = new PizZip(content);

            // AUTO-REPAIR LOGIC (Advanced Tokenizer)
            try {
                const docXmlPath = "word/document.xml";
                if (zip.files[docXmlPath]) {
                    const xml = zip.files[docXmlPath].asText();
                    let newXml = "";
                    let lastIndex = 0;
                    let openMatch = null; // { index: number, value: string }

                    // Regex to find all delimiter occurrences
                    const regex = /\{\{|\}\}/g;
                    let match;

                    while ((match = regex.exec(xml)) !== null) {
                        if (match[0] === '{{') {
                            if (openMatch) {
                                // We found {{ but we already had one open!
                                // It means the previous one was a spurious/duplicate open.
                                // Append everything from lastIndex up to this new matches index
                                // BUT skip the previous open tag itself if we haven't appended it yet?
                                // Actually, standard logic:
                                // "Previous open" was at openMatch.index.
                                // We have NOT appended anything from openMatch.index yet.
                                // We should append the CONTENT between them, but IGNORE the previous {{.
                                // So append xml.slice(openMatch.index + 2, match.index)
                                newXml += xml.slice(openMatch.index + 2, match.index);
                            } else {
                                // No open tag, valid start.
                                // Append text before this tag
                                newXml += xml.slice(lastIndex, match.index);
                            }
                            // Set new open
                            openMatch = { index: match.index };
                            lastIndex = match.index; // We haven't appended this {{ yet
                        } else if (match[0] === '}}') {
                            if (openMatch) {
                                // Valid Pair found: openMatch.index to match.index + 2
                                const rawContent = xml.slice(openMatch.index + 2, match.index);
                                // Clean the content: Strip all XML tags
                                const cleanContent = rawContent.replace(/<[^>]+>/g, "");
                                newXml += "{{" + cleanContent + "}}";

                                openMatch = null;
                                lastIndex = match.index + 2;
                            } else {
                                // Orphan }} (Duplicate close).
                                // Append text before this, but SKIP this }}
                                newXml += xml.slice(lastIndex, match.index);
                                lastIndex = match.index + 2; // Skip the }}
                            }
                        }
                    }
                    // Append remainder
                    newXml += xml.slice(lastIndex);

                    // Also strip any completely empty {{}} if any
                    // newXml = newXml.replace(/\{\{\}\}/g, ""); 

                    zip.file(docXmlPath, newXml);
                    console.log("[Auto-Repair] Advanced tokenizer cleanup applied.");
                }
            } catch (repairErr) {
                console.warn("[Auto-Repair] Failed:", repairErr);
            }

            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                nullGetter: () => "",
                delimiters: { start: '[%', end: '%]' }
            });

            // Handle date with precedence: passed date > current date
            // Note: If passed date is DD-MM-YYYY, we stick to it. If not passed, we use Long format.
            let letterDate = date;
            if (!letterDate) {
                letterDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            }

            const companyName = "Inspire Softech Solutions";

            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const d = new Date(dateStr);
                return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
            };

            doc.render({
                // Student Details
                name: studentData.name,
                registerNumber: studentData.registerNumber || '',
                department: studentData.department || '',
                year: studentData.year || '',
                institutionName: studentData.institutionName || '',
                pincode: studentData.pincode || '',
                city: studentData.city || '',
                state: studentData.state || '',

                // Course/Internship Details
                title: courseData.title,
                internshipName: courseData.title, // Alias
                courseName: courseData.title, // Alias

                // Dates (DD/MM/YYYY)
                startDate: formatDate(courseData.startDate),
                endDate: formatDate(courseData.endDate),
                Start_Date: formatDate(courseData.startDate), // Potential Template Alias
                End_Date: formatDate(courseData.endDate), // Potential Template Alias

                // Meta
                today: letterDate, // Use the resolved date
                date: letterDate,
                companyName: companyName, // Dynamic Company Name
                Company_Name: companyName,

                // Name Variations
                Name: studentData.name,
                NAME: studentData.name.toUpperCase()
            });

            const buf = doc.getZip().generate({ type: 'nodebuffer' });
            const result = await mammoth.convertToHtml({ buffer: buf });

            htmlContent = `
                <html>
                    <head>
                        <style>
                            @page { size: A4 portrait; margin: 1cm; }
                            body { font-family: 'Times New Roman', serif; line-height: 1.25; font-size: 11pt; color: #000; }
                            p { margin-bottom: 8px; margin-top: 0; }
                            table { width: 100%; border-collapse: collapse; }
                            td, th { border: 1px solid #ddd; padding: 4px; }
                        </style>
                    </head>
                    <body>
                        ${result.value}
                    </body>
                </html>
            `;

        } else {
            // --- IMAGE TEMPLATE PROCESSING (Fallback) ---
            let templateBase64 = '';
            if (fs.existsSync(templatePath)) {
                const imageBuffer = fs.readFileSync(templatePath);
                const mimeType = templatePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
                templateBase64 = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
            }

            if (isOfferLetter || type === 'acceptance-letter') {
                // HYBRID APPROACH: HTML Text Overlay on Background Image
                // Determine Date: Use passed date if available, else formatted Today
                let today = date;
                if (!today) {
                    today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                }

                // Content based on the "Clean Template" text
                htmlContent = `
                <html>
                    <head>
                        <style>
                            @page { size: A4 portrait; margin: 0; }
                            body { 
                                margin: 0; 
                                padding: 0; 
                                width: 210mm; 
                                height: 297mm; 
                                position: relative; 
                                font-family: 'Times New Roman', serif; 
                                font-size: 12pt; 
                                color: #000;
                                box-sizing: border-box;
                            }
                            .bg { 
                                width: 100%; 
                                height: 100%; 
                                position: absolute; 
                                top: 0; 
                                left: 0; 
                                z-index: -2; 
                                object-fit: cover; 
                            }
                            /* Auto-Mask: Covers the middle content of the template image (e.g. old text) */
                            .mask {
                                position: absolute;
                                top: 4.5cm;     /* Leave space for Header/Logo */
                                bottom: 2.5cm;  /* Leave space for Footer */
                                left: 1cm;      /* Side margins for cleanliness */
                                right: 1cm;
                                background: white;
                                z-index: -1;
                            }
                            .container {
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 100%;
                                height: 100%;
                                padding: 5.5cm 2.5cm 2.5cm 2.5cm; /* Margins: Top space for Header Logo */
                                box-sizing: border-box;
                                z-index: 1;
                            }
                            .date { text-align: right; font-weight: bold; margin-bottom: 20px; margin-top: 40px; }
                            .to-address { margin-bottom: 30px; line-height: 1.4; }
                            .to-label { font-size: 14pt; margin-bottom: 5px; }
                            .student-details { font-weight: bold; font-size: 13pt; margin-left: 10px; }
                            .title { 
                                text-align: center; 
                                font-weight: bold; 
                                text-decoration: underline; 
                                font-size: 16pt; 
                                margin: 20px 0; 
                                text-transform: uppercase;
                            }
                            .salutation { font-size: 13pt; margin-bottom: 15px; }
                            .body-text { 
                                text-align: justify; 
                                font-size: 13pt; 
                                line-height: 1.6; 
                                margin-bottom: 20px; 
                            }
                            .details-table { margin: 20px 0; margin-left: 20px; font-size: 13pt; }
                            .details-table td { padding: 5px 15px 5px 0; vertical-align: top; }
                            .closing { font-size: 13pt; margin-top: 30px; }
                            .signature-section { margin-top: 60px; font-weight: bold; font-size: 13pt; }
                            .sign-name { margin-top: 50px; }
                            .qr-code {
                                position: absolute;
                                top: 3.5cm; /* Aligned with Header space */
                                right: 2cm;
                                width: 2.5cm;
                                height: 2.5cm;
                                z-index: 10;
                            }
                            .cert-id-text {
                                position: absolute;
                                top: 6.2cm; /* Just below QR (3.5 + 2.5 + margin) */
                                right: 1.25cm; /* Adjusted to center relative to QR */
                                width: 4cm; /* Wider to prevent wrapping */
                                text-align: center;
                                font-size: 8pt;
                                font-family: 'Helvetica', sans-serif;
                                z-index: 10;
                                background: rgba(255,255,255,0.8); /* readable on bg */
                            }
                        </style>
                    </head>
                    <body>
                        ${templateBase64 ? `<img src="${templateBase64}" class="bg" />` : ''}
                        ${qrCode ? `<img src="${qrCode}" class="qr-code" />` : ''}
                        
                        <!-- <div class="mask"></div> -->
                        <div class="container">
                            <div class="date">${today}</div>
                            
                            <div class="to-address">
                                <div class="to-label">To</div>
                                <div class="student-details">
                                    ${studentData.name}<br>
                                    ${studentData.registerNumber || ''}<br>
                                    ${studentData.year ? studentData.year + ' & ' : ''}${studentData.department || ''}<br>
                                    ${studentData.institutionName || ''}
                                </div>
                            </div>

                            <div class="title">${isAcceptance ? 'Project Acceptance Letter' : 'Internship Offer Letter'}</div>

                            <div class="salutation">
                                Dear <b>${studentData.name}</b>,
                            </div>

                            <div class="body-text">
                                ${isAcceptance
                        ? `We <b>Inspire Softech Solutions</b> are pleased to accept your academic project titled <b>"${courseData.title.toUpperCase()}"</b>. Looking forward to your contribution.`
                        : `We <b>Inspire Softech Solutions</b> are very pleased to offer you an AICTE – INSPIRE internship on <b>"${courseData.title.toUpperCase()}"</b> in our organization. Please find the following confirmation that specifies about your internship.`
                    }
                            </div>

                            <table class="details-table">
                                <tr>
                                    <td>${isAcceptance ? 'Project Title:' : 'Position Title:'}</td>
                                    <td>${isAcceptance ? courseData.title : 'Technical Intern'}</td>
                                </tr>
                                <tr>
                                    <td>Start Date:</td>
                                    <td><b>${courseData.startDate ? new Date(courseData.startDate).toLocaleDateString() : 'Immediate'}</b></td>
                                </tr>
                                <tr>
                                    <td>End Date:</td>
                                    <td><b>${courseData.endDate ? new Date(courseData.endDate).toLocaleDateString() : 'TBD'}</b></td>
                                </tr>
                            </table>

                            <div class="closing">
                                Wish you all the best.<br><br>
                            </div>

                        </div>
                    </body>
                </html>
                `;
            } else {
                // --- STANDARDIZED CERTIFICATE OVERLAY SYSTEM ---
                // FIXED ZONES (Immutable positions)
                // A4 Landscape is approx 1123px x 794px (at 96 DPI) or just use % for flexibility

                const NAME_POSITION = {
                    top: '35%',     // Moved UP to avoid line overlap (was 38%)
                    left: '10%',
                    width: '80%',
                    fontSize: '40px', // slightly smaller might help too if name is long, but pos is key
                    fontFamily: "'Times New Roman', serif"
                };

                const LINE2_POSITION = {
                    top: '48%',     // Moved UP from 56% to clear the static text below
                    left: '15%',
                    width: '70%',
                    fontSize: '20px', // Slightly smaller
                    fontFamily: "'Helvetica', sans-serif"
                };

                const QR_POSITION = {
                    top: '30px',
                    right: '30px',
                    size: '110px'
                };

                const CERT_ID_POSITION = {
                    top: '145px',       // Immediately below QR
                    right: '30px',      // Aligned with QR 'right'
                    width: '110px',     // Same width as QR
                    fontSize: '11px',
                    fontFamily: "'Courier New', monospace"
                };

                // Logic for content
                // Line 1: Name + Register Number
                // "IN FIRST LINE NAME & REGISTER NUMBER"
                const line1Text = [
                    studentData.name,
                    studentData.registerNumber ? `(${studentData.registerNumber})` : null
                ].filter(Boolean).join(' ');

                // Line 2: College Name
                // "IN SECOND LINE COLLEGE NAME"
                const line2Text = studentData.institutionName || '';

                htmlContent = `
                <html>
                    <head>
                        <style>
                            @page { size: A4 landscape; margin: 0; }
                            body { 
                                margin: 0; 
                                padding: 0; 
                                width: 100vw; 
                                height: 100vh; 
                                border: none; /* No border to avoid offsets */
                                overflow: hidden; 
                                position: relative; 
                            }
                            
                            /* BACKGROUND LAYER */
                            .bg { 
                                width: 100%; 
                                height: 100%; 
                                position: absolute; 
                                top: 0; 
                                left: 0; 
                                z-index: -1; 
                                object-fit: cover; 
                            }

                            /* NAME LAYER */
                            .name-zone { 
                                position: absolute; 
                                top: ${NAME_POSITION.top}; 
                                left: ${NAME_POSITION.left}; 
                                width: ${NAME_POSITION.width}; 
                                text-align: center; 
                                font-size: ${NAME_POSITION.fontSize}; 
                                font-weight: bold; 
                                font-family: ${NAME_POSITION.fontFamily};
                                text-transform: uppercase;
                                color: #000;
                            }

                            /* SECONDARY LINE LAYER */
                            .line2-zone { 
                                position: absolute; 
                                top: ${LINE2_POSITION.top}; 
                                left: ${LINE2_POSITION.left}; 
                                width: ${LINE2_POSITION.width}; 
                                text-align: center; 
                                font-size: ${LINE2_POSITION.fontSize}; 
                                color: #333; 
                                font-weight: bold; 
                                font-family: ${LINE2_POSITION.fontFamily};
                                text-transform: uppercase;
                            }

                            /* QR CODE FIXED ZONE */
                            .qr-code {
                                position: absolute;
                                top: ${QR_POSITION.top};
                                right: ${QR_POSITION.right};
                                width: ${QR_POSITION.size};
                                height: ${QR_POSITION.size};
                                z-index: 10;
                            }

                            /* CERTIFICATE ID FIXED ZONE */
                            .cert-id-text {
                                position: absolute;
                                top: ${CERT_ID_POSITION.top};
                                right: ${CERT_ID_POSITION.right};
                                width: ${CERT_ID_POSITION.width};
                                text-align: center;
                                font-size: ${CERT_ID_POSITION.fontSize};
                                font-family: ${CERT_ID_POSITION.fontFamily};
                                color: #000;
                                z-index: 10;
                                background: rgba(255,255,255,0.7);
                                padding: 2px 0;
                                font-weight: bold;
                                border-radius: 4px;
                            }
                        </style>
                    </head>
                    <body>
                        ${templateBase64 ? `<img src="${templateBase64}" class="bg" />` : ''}
                        
                        ${qrCode ? `<img src="${qrCode}" class="qr-code" />` : ''}
                        
                        ${certificateId ? `<div class="cert-id-text">${certificateId}</div>` : ''}
                        
                        <div class="name-zone">${line1Text}</div>
                        <div class="line2-zone">${line2Text}</div>
                    </body>
                </html>
                `;
            }
        }

        if (htmlContent) {
            const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
            const page = await browser.newPage();
            await page.setContent(htmlContent);

            await page.pdf({
                path: filePath,
                format: 'A4',
                landscape: !isOfferLetter && !isAcceptance && !isDocx, // Portrait for offer/acceptance
                printBackground: true,
                margin: isDocx ? { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' } : undefined
            });

            await browser.close();
            console.log(`[Generated] PDF created at ${filePath}`);
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"EdinzTech Cert" <noreply@edinztech.com>',
            to: studentData.email,
            subject: isAcceptance
                ? `Project Acceptance: ${courseData.title}`
                : isOfferLetter ? `Your Internship Offer Letter: ${courseData.title}` : `Your Certificate: ${courseData.title}`,
            text: isAcceptance
                ? `Dear ${studentData.name},\n\nWe are pleased to accept your project application. Please find your Acceptance Letter attached.\n\nBest Regards,\nEdinzTech Team`
                : isOfferLetter
                    ? `Dear ${studentData.name},\n\nWe are pleased to share your Internship Offer Letter.\n\nPlease find the document attached.\n\nBest Regards,\nEdinzTech Team`
                    : `Congratulations ${studentData.name}!\n\nPlease find your certificate attached.\n\nBest Regards,\nEdinzTech Team`,
            attachments: [{
                filename: `${isAcceptance ? 'Acceptance_Letter' : (isOfferLetter ? 'Offer_Letter' : 'Certificate')}_${studentData.name.replace(/\s/g, '_')}.pdf`,
                path: filePath
            }]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Sent] Message ID: ${info.messageId}`);

        const downloadUrl = `${process.env.SERVICE_URL || `http://72.60.103.246:${PORT}`}/files/${certificateId}.pdf`;

        try {
            await axios.post(callbackUrl, {
                certificateId,
                status: 'sent',
                metadata: {
                    messageId: info.messageId,
                    generatedAt: new Date(),
                    email: studentData.email,
                    fileUrl: downloadUrl
                }
            });
            console.log(`[Callback] Success reported to ${callbackUrl}`);
        } catch (cbErr) {
            console.warn(`[Callback Warning] Failed to report status to ${callbackUrl}:`, cbErr.message);
            // Do NOT throw error here, as email is already sent and generation is successful.
        }


    } finally {
        if (fs.existsSync(filePath)) {
            // fs.unlinkSync(filePath);
        }
    }
}

app.get('/health', (req, res) => res.send('Certificate Service Operational'));

app.listen(PORT, () => {
    console.log(`Certificate Service running on port ${PORT}`);
});
