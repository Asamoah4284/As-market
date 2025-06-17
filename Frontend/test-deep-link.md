# Deep Link Testing Guide

## Testing Deep Links

### 1. Development Testing
To test deep links during development:

1. **Start your app** in development mode
2. **Open terminal/command prompt**
3. **Test the deep link** using one of these methods:

#### For Android:
```bash
adb shell am start -W -a android.intent.action.VIEW -d "asarion://reset-password?token=test_token_123" com.asarion.marketplace
```

#### For iOS Simulator:
```bash
xcrun simctl openurl booted "asarion://reset-password?token=test_token_123"
```

#### For Physical iOS Device:
- Open Safari
- Type: `asarion://reset-password?token=test_token_123`
- Press Enter

### 2. Email Testing
1. **Request a password reset** from the app
2. **Check your email** for the reset link
3. **Click the link** - it should open your app directly

### 3. Expected Behavior
- ✅ App opens directly (not browser)
- ✅ Navigates to ResetPassword screen
- ✅ Token is extracted and displayed in console
- ✅ User can enter new password

### 4. Troubleshooting

#### If deep link doesn't work:
1. **Rebuild the app** after adding deep link configuration
2. **Check app.json** has correct scheme and intent filters
3. **Verify package name** matches in app.json
4. **Clear app data** and reinstall

#### If token extraction fails:
1. **Check console logs** for token extraction
2. **Verify URL format**: `asarion://reset-password?token=YOUR_TOKEN`
3. **Test with different token values**

### 5. Production Considerations
- **Update FRONTEND_URL** in backend .env for production
- **Test on real devices** (not just simulators)
- **Verify SendGrid email delivery**
- **Monitor deep link analytics** if needed

## Deep Link URL Format
```
asarion://reset-password?token=YOUR_RESET_TOKEN
```

## Security Notes
- Tokens expire after 1 hour
- Invalid tokens show error message
- Deep links work even if app is closed
- App handles both route params and deep links 