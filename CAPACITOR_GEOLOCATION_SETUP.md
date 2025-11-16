# Capacitor Geolocation Setup

## ✅ Changes Completed

All code has been updated to use proper Capacitor geolocation functions that work seamlessly on both native Android/iOS apps and web browsers.

### Files Modified:

1. **New Utility Created**: `/src/utilities/geolocation.ts`
   - Centralized geolocation function using Capacitor
   - Handles permissions for native platforms
   - Graceful fallback to web geolocation API
   - Works on Android, iOS, and web

2. **Hospital Detail Card**: `/src/app/(frontend)/hospitals/[slug]/HospitalDetailCard.tsx`
   - Updated to use new `getDeviceLocation()` utility
   - Auto-requests location on mount
   - UCMC fallback when geolocation unavailable

3. **Base Detail Card**: `/src/app/(frontend)/bases/[slug]/BaseDetailCard.tsx`
   - Updated to use new `getDeviceLocation()` utility
   - Auto-requests location on mount
   - UCMC fallback when geolocation unavailable

4. **Hospital Listing**: `/src/app/(frontend)/hospitals/page.client.tsx`
   - Updated to use Capacitor geolocation
   - Distance sorting on mobile devices

5. **Base Listing**: `/src/app/(frontend)/bases/page.client.tsx`
   - Updated to use Capacitor geolocation
   - Distance sorting on mobile devices

## 📦 Required Package Installation

You need to install the Capacitor Geolocation plugin:

```bash
pnpm add @capacitor/geolocation
```

## 🔧 Android Configuration

After installing the package, you need to add the necessary permissions to your Android app.

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

## 📱 How It Works

### On Native Apps (Android/iOS):
1. Requests geolocation permissions when first accessed
2. Uses Capacitor's native geolocation API
3. Provides high-accuracy positioning

### On Web:
1. Falls back to browser's `navigator.geolocation`
2. Requests browser permissions as normal
3. Same user experience as native

### Fallback Behavior:
- If geolocation is denied or unavailable
- Automatically falls back to UC Medical Center coordinates
- Displays "Based on location to UC Medical Center" text
- Users can still manually retry by clicking the refresh icon

## ✨ User Experience

- **Auto-loading**: ETAs calculate automatically on page load
- **Icon button**: Compact refresh button to re-request location
- **Smart fallback**: Always shows useful distance/ETA information
- **Cross-platform**: Works identically on Android, iOS, and web
