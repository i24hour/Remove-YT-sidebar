// background.js

// --- Configuration ---
const WEBHOOK_URL = "YOUR_WEBHOOK_URL_GOES_HERE"; // User must replace this
const ALARM_NAME = "daily_report_check";
const CHECK_INTERVAL_MINUTES = 15;

// --- State ---
let currentSession = null; // { url, title, startTime }

// --- Initialization ---
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed/updated. Setting up alarms.");
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: CHECK_INTERVAL_MINUTES });
});

// --- Tracking Logic ---

function startSession(tab) {
    if (!tab || !tab.url || !tab.active) return;

    // Ignore chrome:// and other internal pages if desired, but user asked for all URLs

    currentSession = {
        url: tab.url,
        title: tab.title,
        startTime: Date.now()
    };
    console.log("Started session:", currentSession.title);
}

async function endSession() {
    if (!currentSession) return;

    const endTime = Date.now();
    const durationMs = endTime - currentSession.startTime;

    // Only save significant sessions (> 1 second)
    if (durationMs > 1000) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const key = `sessions-${today}`;

        const sessionData = {
            url: currentSession.url,
            title: currentSession.title,
            startTime: currentSession.startTime,
            endTime: endTime,
            durationMs: durationMs
        };

        try {
            const result = await chrome.storage.local.get([key]);
            const sessions = result[key] || [];
            sessions.push(sessionData);
            await chrome.storage.local.set({ [key]: sessions });
            console.log("Saved session:", sessionData);
        } catch (e) {
            console.error("Failed to save session:", e);
        }
    }

    currentSession = null;
}

async function handleStateChange() {
    await endSession();

    // Get current active tab and window state
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const window = tab ? await chrome.windows.get(tab.windowId) : null;
    const idleState = await new Promise(resolve => chrome.idle.queryState(60, resolve));

    if (tab && window && window.focused && idleState === 'active') {
        startSession(tab);
    } else {
        console.log("Tracking paused (idle/inactive/no tab)");
    }
}

// Listeners
chrome.tabs.onActivated.addListener(handleStateChange);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        handleStateChange();
    }
});
chrome.windows.onFocusChanged.addListener(handleStateChange);
chrome.idle.onStateChanged.addListener(handleStateChange);


// --- Reporting Logic ---

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
        await checkAndSendReport();
    }
});

async function checkAndSendReport() {
    const today = new Date().toISOString().split('T')[0];
    const lastReportDateKey = "last_report_date";

    const result = await chrome.storage.local.get([lastReportDateKey]);
    const lastReportDate = result[lastReportDateKey];

    // If we haven't sent a report for "yesterday" (or any previous day)
    // Logic: Check if today is different from lastReportDate. 
    // If lastReportDate is missing, set it to today (first run) and skip.

    if (!lastReportDate) {
        await chrome.storage.local.set({ [lastReportDateKey]: today });
        return;
    }

    if (lastReportDate !== today) {
        // Date changed! Send report for the *previous* day (lastReportDate)
        console.log(`Date changed from ${lastReportDate} to ${today}. Generating report.`);
        await generateAndSendReport(lastReportDate);

        // Update last report date to today
        await chrome.storage.local.set({ [lastReportDateKey]: today });
    }
}

async function generateAndSendReport(dateString) {
    const key = `sessions-${dateString}`;
    const result = await chrome.storage.local.get([key]);
    const sessions = result[key] || [];

    if (sessions.length === 0) {
        console.log(`No sessions found for ${dateString}. Skipping report.`);
        return;
    }

    // Aggregate by URL
    const summary = {};
    sessions.forEach(session => {
        // Normalize URL to avoid duplicates (optional, keeping simple for now)
        const url = session.url;
        if (!summary[url]) {
            summary[url] = {
                title: session.title,
                durationMs: 0,
                url: url
            };
        }
        summary[url].durationMs += session.durationMs;
    });

    // Sort by duration desc
    const sortedItems = Object.values(summary).sort((a, b) => b.durationMs - a.durationMs);

    // Build text body
    let body = `Daily browsing report for ${dateString}\n\n`;

    sortedItems.forEach(item => {
        const hours = Math.floor(item.durationMs / 3600000);
        const minutes = Math.floor((item.durationMs % 3600000) / 60000);
        const timeStr = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;

        body += `${timeStr} - ${item.title} (${item.url})\n`;
    });

    console.log("Sending report:", body);

    // Send to Webhook
    if (WEBHOOK_URL === "YOUR_WEBHOOK_URL_GOES_HERE") {
        console.error("Webhook URL not configured!");
        return;
    }

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                date: dateString,
                body: body
            })
        });

        const text = await response.text();
        console.log("Webhook response:", text);

        // Optional: Clear old data to save space
        await chrome.storage.local.remove(key);

    } catch (e) {
        console.error("Failed to send report:", e);
    }
}
