# Product Sharing Test Guide

## Testing Product Sharing Functionality

### 1. Development Testing

#### Test the Share Button
1. **Open the app** and navigate to any product details screen
2. **Tap the share button** (either in header or near rating stars)
3. **Verify the native share sheet appears** with the product information
4. **Test sharing to different apps** (WhatsApp, Messages, Email, etc.)

#### Test Deep Link Navigation
1. **Generate a share link** from a product
2. **Copy the deep link URL** (format: `asarion://product?id=PRODUCT_ID`)
3. **Test the deep link** using one of these methods:

##### For Android:
```bash
adb shell am start -W -a android.intent.action.VIEW -d "asarion://product?id=YOUR_PRODUCT_ID" com.asarion.marketplace
```

##### For iOS Simulator:
```bash
xcrun simctl openurl booted "asarion://product?id=YOUR_PRODUCT_ID"
```

##### For Physical iOS Device:
- Open Safari
- Type: `asarion://product?id=YOUR_PRODUCT_ID`
- Press Enter

### 2. Expected Behavior

#### Share Functionality:
- ✅ Share button appears in header and product info section
- ✅ Native share sheet opens with product details
- ✅ Share message includes product name, price, and deep link
- ✅ Deep link URL is properly formatted

#### Deep Link Navigation:
- ✅ App opens directly (not browser)
- ✅ Navigates to correct ProductDetails screen
- ✅ Product ID is extracted and displayed
- ✅ Product data loads correctly

### 3. Share Message Format
```
Check out this amazing product: [Product Name]

Price: GH₵[Price]

asarion://product?id=[Product ID]

If the link doesn't work, visit: https://your-website.com/product/[Product ID]
```

### 4. Deep Link URL Format
```
asarion://product?id=YOUR_PRODUCT_ID
```

### 5. Troubleshooting

#### If share button doesn't work:
1. **Check Share API import** in ProductDetailsScreen.js
2. **Verify product data** is available before sharing
3. **Test on real device** (Share API may not work in simulator)

#### If deep link doesn't work:
1. **Rebuild the app** after adding deep link configuration
2. **Check app.json** has correct intent filters
3. **Verify App.js** has proper deep link handling
4. **Clear app data** and reinstall

#### If product doesn't load from deep link:
1. **Check console logs** for product ID extraction
2. **Verify product ID** exists in database
3. **Test with different product IDs**

### 6. Production Considerations
- **Update web URL** in share message for production
- **Test on multiple devices** and platforms
- **Monitor deep link analytics** if needed
- **Consider implementing link previews** for social media

## Implementation Details

### Files Modified:
1. **app.json** - Added product deep link intent filter
2. **App.js** - Added product deep link handling
3. **ProductDetailsScreen.js** - Added share functionality and UI

### Key Features:
- Native Share API integration
- Deep link generation and handling
- Fallback web URL support
- Multiple share button locations
- Proper error handling

### Security Notes:
- Product IDs are validated before navigation
- Deep links work even if app is closed
- Invalid product IDs show error message
- Share functionality requires product data to be loaded 