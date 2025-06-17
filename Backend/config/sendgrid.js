const sgMail = require('@sendgrid/mail');

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const msg = {
      to: to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com', // Replace with your verified sender
      subject: subject,
      html: htmlContent,
    };

    const response = await sgMail.send(msg);
    console.log('Email sent successfully:', response[0].statusCode);
    return true;
  } catch (error) {
    console.error('SendGrid error:', error);
    if (error.response) {
      console.error('SendGrid response body:', error.response.body);
    }
    return false;
  }
};

const sendPasswordResetEmail = async (email, resetToken, userName) => {
  // Use deep link URL for mobile app
  const resetUrl = `asarion://reset-password?token=${resetToken}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #5D3FD3, #7B68EE);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          background: #000000;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
        .warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .mobile-note {
          background: #e3f2fd;
          border: 1px solid #2196f3;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Password Reset Request</h1>
      </div>
      <div class="content">
        <h2>Hello ${userName},</h2>
        <p>We received a request to reset your password for your account. If you didn't make this request, you can safely ignore this email.</p>
        
        <p>To reset your password, click the button below:</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </div>
        
        <div class="mobile-note">
          <strong>📱 Mobile App:</strong> If you're on a mobile device, this link will open the Asarion app to reset your password.
        </div>
        
        <div class="warning">
          <strong>Important:</strong> This link will expire in 1 hour for security reasons.
        </div>
        
        <p>If you have any questions, please contact our support team.</p>
        
        <p>Best regards,<br>The Asarion Team</p>
      </div>
      <div class="footer">
        <p>This email was sent to ${email}. If you didn't request a password reset, please ignore this email.</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, 'Password Reset Request - Asarion', htmlContent);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail
}; 