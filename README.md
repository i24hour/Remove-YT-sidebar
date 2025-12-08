# iCTrL - Daily Activity Tracker

A Chrome extension that **hides YouTube distractions** (sidebar & recommendations) and **tracks your daily browsing activity** with automatic email reports.

## ✨ Features

### YouTube Cleanup
- **Hides Sidebar**: Removes the `#related` section containing video suggestions
- **Hides Related Chips**: Removes the `#related-chips` filter bar
- **Auto-Expand Player**: Video player fills available width for distraction-free viewing

### Activity Tracking
- **All Browsing Tracked**: Monitors time spent on every website (not just YouTube)
- **Smart Session Management**: Handles tab switches, window focus, and idle detection
- **Aggregated Reports**: Groups URLs intelligently (strips hash fragments to avoid Gmail-style fragmentation)
- **Precise Duration**: Shows hours, minutes, and seconds for each site

### Authentication
- **Firebase Auth**: Secure sign-up/sign-in with email verification
- **Firestore Storage**: User profiles stored in cloud database
- **Auto Sign-In**: Automatic login after email verification
- **Local State Sync**: User info cached for offline access

### Email Reports
- **Daily Reports**: Automatic email summaries at day change
- **Manual Trigger**: Send report anytime via popup button
- **Secure Webhook**: Token-validated Google Apps Script backend

## 🚀 Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (top right corner)
4. Click **Load unpacked**
5. Select the extension directory

## ⚙️ Configuration

### 1. Deploy the Backend
Follow the instructions in [APPS_SCRIPT.md](APPS_SCRIPT.md) to deploy the Google Apps Script webhook.

### 2. Configure Credentials
Edit `config.json` with your settings:
```json
{
    "WEBHOOK_URL": "YOUR_GOOGLE_APPS_SCRIPT_URL",
    "SECRET_TOKEN": "YOUR_SECRET_TOKEN"
}
```
> **Note**: `config.json` is git-ignored to protect your credentials.

### 3. Reload Extension
Reload the extension in `chrome://extensions`

## 📁 Project Structure

| File | Description |
|------|-------------|
| `manifest.json` | Extension configuration (permissions, scripts, etc.) |
| `content.js` | YouTube sidebar hiding script |
| `style.css` | Additional CSS for hiding elements |
| `background.js` | Service worker - activity tracking & reporting |
| `popup.html/js` | Main popup UI - send reports, logout |
| `auth.html/js` | Authentication UI - sign up, sign in, email verification |
| `config.json` | Credentials (webhook URL, secret token) - **git-ignored** |
| `firebase-*.js` | Firebase SDK bundles (Auth, Firestore) |

## 🔒 Privacy

See [PRIVACY.md](PRIVACY.md) for details on data handling.

## 📋 Usage

1. **First Launch**: Click extension icon → Create account → Verify email
2. **Daily Use**: Browse normally - all activity is tracked automatically
3. **View Report**: Click extension icon → "Send Report Now" button
4. **Logout**: Click "Logout" button in popup

