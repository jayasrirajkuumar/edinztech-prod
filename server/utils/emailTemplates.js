const getEnrollmentEmailTemplate = ({ isNewUser, name, email, password, programType, programCode, loginUrl, welcomeAddon }) => {
    const headerColor = '#4f46e5'; // Indigo-600 to match frontend logo styling

    let content = '';
    if (isNewUser) {
        content = `
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">Welcome <strong>${name}</strong>!</p>
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">You have successfully enrolled in the <strong>${programType}</strong> (Code: <strong>${programCode || 'N/A'}</strong>).</p>
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h3 style="margin-top: 0; color: #111827; font-size: 18px;">Your Login Credentials</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 80px;">Email:</td>
                        <td style="padding: 8px 0; color: #111827; font-weight: bold; font-size: 16px;">${email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Password:</td>
                        <td style="padding: 8px 0; color: #111827; font-family: monospace; font-size: 16px; font-weight: bold; letter-spacing: 1px;">${password}</td>
                    </tr>
                </table>
            </div>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}" style="background-color: ${headerColor}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Login to your Dashboard</a>
            </div>
        `;
    } else {
        content = `
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">Hi <strong>${name}</strong>,</p>
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">Your enrollment was successful!</p>
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">You are now enrolled in the <strong>${programType}</strong> (Code: <strong>${programCode || 'N/A'}</strong>). You can access your program details directly from your student dashboard.</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}" style="background-color: ${headerColor}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
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

module.exports = {
    getEnrollmentEmailTemplate
};
