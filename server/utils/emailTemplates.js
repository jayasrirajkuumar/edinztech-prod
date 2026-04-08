const getEnrollmentEmailTemplate = ({ isNewUser, name, email, password, programType, programCode, loginUrl, welcomeAddon }) => {
    const headerColor = '#4f46e5'; // Indigo-600 to match frontend logo styling
    const accentColor = '#6366f1'; // Indigo-500
    const successColor = '#10b981'; // Emerald-500

    let content = '';
    if (isNewUser) {
        content = `
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">Welcome <strong>${name}</strong>! 🎉</p>
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">You have successfully enrolled in <strong style="color: ${accentColor};">${programType}</strong></p>
            
            <div style="background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%); border-radius: 8px; padding: 2px; margin: 24px 0;">
                <div style="background-color: #ffffff; border-radius: 6px; padding: 16px;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Program Code</p>
                    <p style="margin: 0; color: #111827; font-size: 20px; font-weight: bold; font-family: 'Courier New', monospace;">${programCode || 'N/A'}</p>
                </div>
            </div>
            
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h3 style="margin-top: 0; color: #111827; font-size: 18px; display: flex; align-items: center;">
                    <span style="color: ${successColor}; margin-right: 8px;">✓</span> Your Login Credentials
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 12px 0; color: #6b7280; font-size: 14px; width: 100px; border-bottom: 1px solid #e5e7eb;">Email:</td>
                        <td style="padding: 12px 0 12px 16px; color: #111827; font-weight: bold; font-size: 15px; border-bottom: 1px solid #e5e7eb;">${email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Password:</td>
                        <td style="padding: 12px 0 12px 16px; color: #111827; font-family: monospace; font-size: 15px; font-weight: bold; letter-spacing: 1px; background-color: #f9fafb; border-radius: 4px; padding: 8px 12px;">${password}</td>
                    </tr>
                </table>
                <p style="color: #ef4444; font-size: 12px; margin: 12px 0 0 0;">⚠️ Keep your credentials secure. Never share them with anyone.</p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}" style="background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); transition: transform 0.2s;">Login to your Dashboard</a>
            </div>
        `;
    } else {
        content = `
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">Hi <strong>${name}</strong>,</p>
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">Your enrollment was successful! 🚀</p>
            
            <div style="background-color: #ecfdf5; border-left: 4px solid ${successColor}; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #065f46; font-size: 15px; line-height: 1.6;">
                    You are now enrolled in <strong>${programType}</strong> (Code: <strong>${programCode || 'N/A'}</strong>). 
                    Your learning journey begins now! You can access all program materials and track your progress from your student dashboard.
                </p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}" style="background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">Go to Dashboard</a>
            </div>
        `;
    }

    if (welcomeAddon) {
        content += `
            <div style="background-color: #eef2ff; border-left: 4px solid ${headerColor}; padding: 16px; margin-top: 24px; border-radius: 0 8px 8px 0;">
                <h4 style="margin-top: 0; color: #3730a3; font-size: 16px;">Additional Information</h4>
                <div style="color: #4338ca; font-size: 14px; line-height: 1.5;">
                    ${welcomeAddon.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Enrollment Confirmed</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                        <!-- Header -->
                        <tr>
                            <td style="background-color: ${headerColor}; padding: 32px 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">EdinzTech</h1>
                                <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">Elevating Your Skills</p>
                            </td>
                        </tr>
                        
                        <!-- Body -->
                        <tr>
                            <td style="padding: 40px;">
                                ${content}
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f3f4f6; padding: 24px 40px; text-align: center;">
                                <p style="color: #6b7280; font-size: 14px; margin: 0;">&copy; ${new Date().getFullYear()} EdinzTech. All rights reserved.</p>
                                <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">This is an automated message, please do not reply to this email.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};

const getCertificateEmailTemplate = ({ studentName, courseName, courseCode, certificateId, qrCodeUrl, downloadUrl, certificateDate }) => {
    const headerColor = '#4f46e5';
    const accentColor = '#6366f1';
    const goldColor = '#f59e0b';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate of Completion</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); margin: 0; padding: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">
                        <!-- Header with Gradient -->
                        <tr>
                            <td style="background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%); padding: 40px 40px; text-align: center; position: relative; overflow: hidden;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 2px; position: relative; z-index: 2;">🎓 EdinzTech</h1>
                                <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px; position: relative; z-index: 2;">Elevating Your Skills</p>
                                <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background-color: rgba(255,255,255,0.1); border-radius: 50%; z-index: 1;"></div>
                            </td>
                        </tr>
                        
                        <!-- Main Content -->
                        <tr>
                            <td style="padding: 48px 40px;">
                                <!-- Certificate Icon -->
                                <div style="text-align: center; margin-bottom: 32px;">
                                    <div style="font-size: 64px; margin-bottom: 16px;">📜</div>
                                    <h2 style="color: #111827; margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">Certificate of Completion</h2>
                                    <p style="color: #6b7280; margin: 0; font-size: 14px; letter-spacing: 0.5px; text-transform: uppercase;">Your Achievement Unlocked</p>
                                </div>

                                <!-- Congratulations Message -->
                                <p style="color: #374151; font-size: 16px; line-height: 1.6; text-align: center; margin: 24px 0;">
                                    Congratulations <strong>${studentName}</strong>!
                                </p>

                                <!-- Certificate Details Card -->
                                <div style="background: linear-gradient(135deg, #f0f4ff 0%, #f9fbff 100%); border: 2px solid ${accentColor}; border-radius: 12px; padding: 24px; margin: 32px 0;">
                                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #e0e7ff;">
                                                <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Course/Program</p>
                                                <p style="color: #111827; font-size: 16px; margin: 0; font-weight: 600;">${courseName}</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #e0e7ff;">
                                                <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Course Code</p>
                                                <p style="color: ${headerColor}; font-size: 16px; margin: 0; font-weight: 700; font-family: 'Courier New', monospace;">${courseCode || 'N/A'}</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #e0e7ff;">
                                                <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Certificate ID</p>
                                                <p style="color: #375a7f; font-size: 14px; margin: 0; font-family: 'Courier New', monospace; word-break: break-all;">${certificateId}</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0;">
                                                <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Date Awarded</p>
                                                <p style="color: #111827; font-size: 16px; margin: 0; font-weight: 600;">${certificateDate}</p>
                                            </td>
                                        </tr>
                                    </table>
                                </div>

                                <!-- CTA Buttons -->
                                <div style="text-align: center; margin: 32px 0;">
                                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                                        <tr>
                                            <td align="center">
                                                <a href="${downloadUrl}" style="background: linear-gradient(135deg, ${goldColor} 0%, #f97316 100%); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 8px 4px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">⬇️ Download Certificate</a>
                                            </td>
                                        </tr>
                                    </table>
                                </div>

                                <!-- QR Code (if available) -->
                                ${qrCodeUrl ? `
                                <div style="text-align: center; margin: 32px 0; padding: 24px; background-color: #f9fafb; border-radius: 12px;">
                                    <p style="color: #6b7280; font-size: 12px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Verify Your Certificate</p>
                                    <img src="${qrCodeUrl}" alt="Certificate QR Code" style="width: 120px; height: 120px; border-radius: 8px; border: 2px solid ${accentColor};">
                                </div>
                                ` : ''}

                                <!-- Achievement Message -->
                                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%); border-left: 4px solid ${goldColor}; border-radius: 8px; padding: 16px; margin: 24px 0;">
                                    <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                                        <strong>🌟 Well Done!</strong> You have successfully completed this course. Keep learning and growing with EdinzTech!
                                    </p>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                                <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">Share your achievement on social media and inspire others! 🚀</p>
                                <p style="color: #9ca3af; font-size: 12px; margin: 8px 0;">&copy; ${new Date().getFullYear()} EdinzTech. All rights reserved.</p>
                                <p style="color: #d1d5db; font-size: 11px; margin: 8px 0 0 0;">This is an automated message, please do not reply to this email.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};

module.exports = {
    getEnrollmentEmailTemplate,
    getCertificateEmailTemplate
};
