# Google Apps Script Setup

To enable the email reporting feature, you need to deploy a small Google Apps Script Web App.

## 1. Create the Script
1. Go to [script.google.com](https://script.google.com/) and click **New Project**.
2. Name it "Chrome Activity Tracker".
3. Delete any code in `Code.gs` and paste the following:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const date = data.date;
    const body = data.body;
    const recipient = "priyanshu85953@gmail.com"; // Your email
    const subject = `Daily browsing report - ${date}`;

    MailApp.sendEmail(recipient, subject, body);

    return ContentService.createTextOutput("OK");
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.toString());
  }
}
```

## 2. Deploy as Web App
1. Click **Deploy** > **New deployment**.
2. Click the **Select type** icon (gear) > **Web app**.
3. Fill in the details:
    - **Description**: Daily Report Webhook
    - **Execute as**: **Me** (your account)
    - **Who has access**: **Anyone** (Important! This allows the extension to call it)
4. Click **Deploy**.
5. **Authorize** the script if prompted (you may need to click "Advanced" > "Go to ... (unsafe)").
6. Copy the **Web App URL** (it ends with `/exec`).

## 3. Configure Extension
1. Open `background.js` in your extension folder.
2. Find the line: `const WEBHOOK_URL = "YOUR_WEBHOOK_URL_GOES_HERE";`
3. Replace `"YOUR_WEBHOOK_URL_GOES_HERE"` with your copied Web App URL.
4. Save the file.
5. Reload the extension in `chrome://extensions`.
