# Privacy Policy

**Last Updated:** December 8, 2025

## Purpose

**iCTrL** is a Chrome extension designed to help users focus on their studies by:
1. Removing YouTube distractions (sidebar recommendations)
2. Tracking daily browsing activity for self-improvement

## Data Collection

### What We Collect

| Data | Purpose | Storage |
|------|---------|---------|
| Name, Email, Phone | Account identification | Firebase Firestore (cloud) |
| Browsing activity (URLs, titles, duration) | Daily activity reports | Chrome local storage |
| Session timestamps | Calculate time spent per site | Chrome local storage |

### What We DO NOT Collect
- Passwords (hashed by Firebase Auth)
- Page content or form data
- Keystrokes or screenshots
- Data from incognito mode

## How It Works

### YouTube Cleanup
Runs locally — hides HTML elements on YouTube pages. No data transmitted.

### Activity Tracking
1. **Local tracking**: Browsing sessions stored in `chrome.storage.local`
2. **Daily reports**: Sent to YOUR email via Google Apps Script webhook
3. **No third-party analytics**: Data only goes to your configured email

### Authentication
- Firebase Authentication handles sign-up/sign-in
- User profile stored in Firestore under your unique user ID
- Email verification required for account activation

## Permissions Used

| Permission | Reason |
|------------|--------|
| `scripting` | Inject YouTube hiding script |
| `tabs` | Track active tab URL and title |
| `storage` | Store sessions and user data locally |
| `idle` | Pause tracking when user is idle |
| `windows` | Detect window focus changes |
| `alarms` | Schedule daily report checks |
| `identity` | Firebase authentication |

## Data Sharing

- **We do NOT sell your data**
- **We do NOT share with third parties**
- Reports are sent ONLY to your own email address

## Data Retention

- Local data: Stored until manually cleared or extension uninstalled
- Firestore: Account data retained until you delete your account

## Your Rights

- View your data anytime via Chrome DevTools (`chrome.storage.local.get()`)
- Delete local data by clearing extension storage
- Delete cloud data by contacting us

## Contact

Questions? Open an issue in the GitHub repository.
