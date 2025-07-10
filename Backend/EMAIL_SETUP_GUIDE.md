# Email Setup Guide - Fix Password Reset

## Problem
The password reset functionality is failing because SendGrid email service is not properly configured.

## Solution Steps

### 1. Create Environment File
Create a `.env` file in the Backend directory with the following variables:

```env
# Database Configuration
MONGODB_URI=your_mongodb_connection_string_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# SendGrid Configuration (REQUIRED for password reset)
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=your_verified_sender_email@yourdomain.com

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 2. SendGrid Setup

#### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com/
2. Sign up for a free account
3. Verify your email address

#### Step 2: Get API Key
1. In SendGrid dashboard, go to Settings > API Keys
2. Click "Create API Key"
3. Name it "Asarion Password Reset"
4. Select "Mail Send" permissions
5. Copy the API key (starts with "SG.")

#### Step 3: Verify Sender Email
1. In SendGrid dashboard, go to Settings > Sender Authentication
2. Click "Verify a Single Sender"
3. Enter your email address (e.g., noreply@yourdomain.com)
4. Check your email and click the verification link
5. Use this verified email as your `SENDGRID_FROM_EMAIL`

### 3. Update Environment Variables
Replace the placeholder values in your `.env` file:

```env
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=your_verified_email@yourdomain.com
```

### 4. Test the Setup

#### Test 1: Check Environment Variables
```bash
cd Backend
node -e "require('dotenv').config(); console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Set' : 'Not set'); console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || 'Not set');"
```

#### Test 2: Test Email Sending
```bash
cd Backend
node -e "
require('dotenv').config();
const { sendEmail } = require('./config/sendgrid');
sendEmail('test@example.com', 'Test Email', '<h1>Test</h1>').then(result => {
  console.log('Email test result:', result);
});
"
```

### 5. Restart Server
After setting up the environment variables:

```bash
cd Backend
npm start
```

### 6. Test Password Reset
1. Open your app
2. Go to Login screen
3. Click "Forgot Password?"
4. Enter a valid email address
5. Click "Send Reset Link"
6. Check the email for the reset link

## Troubleshooting

### Error: "Email service not configured"
- Check that `SENDGRID_API_KEY` is set in your `.env` file
- Check that `SENDGRID_FROM_EMAIL` is set and verified in SendGrid

### Error: "Failed to send reset email"
- Check SendGrid dashboard for delivery status
- Verify the sender email is authenticated
- Check API key permissions include "Mail Send"

### Error: "Network request failed"
- Check your internet connection
- Verify the backend server is running
- Check the API endpoint URL in frontend config

### Deep Link Not Working
- Make sure the app is installed on the device
- Test with a real device (not just simulator)
- Check that the deep link scheme is properly configured

## Alternative Solutions

### Option 1: Use a Different Email Service
If SendGrid doesn't work, you can modify `Backend/config/sendgrid.js` to use:
- Nodemailer with Gmail
- AWS SES
- Mailgun
- Resend

### Option 2: Temporary Workaround
For development/testing, you can temporarily log the reset token to console:

```javascript
// In Backend/controllers/userController.js, forgotPassword function
console.log('Reset token for testing:', resetToken);
```

## Security Notes
- Never commit your `.env` file to version control
- Use environment variables for all sensitive data
- Regularly rotate your API keys
- Monitor SendGrid usage and delivery rates

## Production Deployment
For production deployment:
1. Set environment variables on your hosting platform
2. Use a verified domain for sender authentication
3. Set up proper DNS records for email deliverability
4. Monitor email delivery rates and bounces 