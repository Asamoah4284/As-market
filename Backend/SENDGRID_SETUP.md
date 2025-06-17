# SendGrid Setup for Password Reset with Deep Linking

## Prerequisites
1. A SendGrid account (sign up at https://sendgrid.com/)
2. A verified sender email address
3. Expo app with deep linking configured

## Setup Steps

### 1. Get SendGrid API Key
1. Log in to your SendGrid account
2. Go to Settings > API Keys
3. Create a new API Key with "Mail Send" permissions
4. Copy the API key

### 2. Verify Sender Email
1. In SendGrid, go to Settings > Sender Authentication
2. Verify your sender email address
3. Use this verified email as your `SENDGRID_FROM_EMAIL`

### 3. Environment Variables
Add these to your `.env` file:

```env
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=your_verified_sender_email@yourdomain.com

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000
```

### 4. Deep Linking Configuration
The app is configured to use deep links with the scheme `asarion://`. 
Password reset links will use the format: `asarion://reset-password?token=YOUR_TOKEN`

## API Endpoints

### Forgot Password
- **POST** `/api/users/forgot-password`
- **Body**: `{ "email": "user@example.com" }`
- **Response**: Success message (doesn't reveal if email exists)

### Reset Password
- **POST** `/api/users/reset-password`
- **Body**: `{ "token": "reset_token", "newPassword": "new_password" }`
- **Response**: Success message

## Deep Link Flow

1. **User requests password reset** → Email sent with deep link
2. **User clicks email link** → App opens directly (not browser)
3. **App navigates to ResetPassword screen** → Token extracted from URL
4. **User enters new password** → Password updated via API
5. **User redirected to login** → Can login with new password

## Security Features
- Reset tokens expire after 1 hour
- Tokens are cryptographically secure (32 bytes random)
- Email addresses are not revealed in responses
- Rate limiting applied to prevent abuse
- Passwords are hashed using bcrypt
- Deep links work even when app is closed

## Testing Deep Links

### Development Testing
```bash
# Android
adb shell am start -W -a android.intent.action.VIEW -d "asarion://reset-password?token=test_token_123" com.asarion.marketplace

# iOS Simulator
xcrun simctl openurl booted "asarion://reset-password?token=test_token_123"
```

### Email Testing
1. Request password reset from app
2. Check email for reset link
3. Click link - should open app directly

## Troubleshooting

### Deep Link Issues
- Rebuild app after configuration changes
- Verify app.json has correct scheme and intent filters
- Test on real devices (not just simulators)
- Clear app data and reinstall if needed

### Email Issues
- Check SendGrid API key is correct
- Verify sender email is authenticated
- Check SendGrid dashboard for delivery status
- Test with different email providers

## Production Considerations
- Update FRONTEND_URL for production environment
- Test deep links on multiple devices and platforms
- Monitor SendGrid delivery rates
- Consider implementing deep link analytics 