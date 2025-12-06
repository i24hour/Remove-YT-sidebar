// background.js

// --- Configuration (loaded from config.json) ---
let WEBHOOK_URL = "";
let SECRET_TOKEN = "";
const ALARM_NAME = "daily_report_check";
const CHECK_INTERVAL_MINUTES = 15;

// Load config from file
async function loadConfig() {
    try {
        const response = await fetch(chrome.runtime.getURL('config.json'));
        const config = await response.json();
        WEBHOOK_URL = config.WEBHOOK_URL || "";
        SECRET_TOKEN = config.SECRET_TOKEN || "";
        console.log("Config loaded successfully");
    } catch (e) {
        console.error("Failed to load config.json:", e);
    }
}
loadConfig();

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

    const sessionToSave = currentSession;
    currentSession = null; // Atomic clear

    const endTime = Date.now();
    const durationMs = endTime - sessionToSave.startTime;

    // Save ALL sessions, even short ones
    if (durationMs > 0) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const key = `sessions-${today}`;

        const sessionData = {
            url: sessionToSave.url,
            title: sessionToSave.title,
            startTime: sessionToSave.startTime,
            endTime: endTime,
            durationMs: durationMs
        };

        try {
            const result = await chrome.storage.local.get([key]);
            const sessions = result[key] || [];
            sessions.push(sessionData);
            await chrome.storage.local.set({ [key]: sessions });
            console.log(`Saved session (${durationMs}ms):`, sessionToSave.title);
        } catch (e) {
            console.error("Failed to save session:", e);
        }
    }
}

// --- Sequential Execution Queue ---
let stateChangeChain = Promise.resolve();

function queueStateChange() {
    stateChangeChain = stateChangeChain.then(handleStateChange).catch(err => {
        console.error("State change error:", err);
    });
}

async function handleStateChange() {
    await endSession();

    // Get current active tab and window state
    // Use a slight delay to allow browser state to settle (e.g. window focus)
    await new Promise(resolve => setTimeout(resolve, 100));

    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

    // Double check if tab is still valid and active
    if (!tab || !tab.active) {
        console.log("Tracking paused (no active tab)");
        return;
    }

    const window = await chrome.windows.get(tab.windowId);
    const idleState = await new Promise(resolve => chrome.idle.queryState(60, resolve));

    if (window && window.focused && idleState === 'active') {
        startSession(tab);
    } else {
        console.log("Tracking paused (idle/inactive/no tab)");
    }
}

// Listeners
chrome.tabs.onActivated.addListener(queueStateChange);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check for URL change OR status complete
    if ((changeInfo.status === 'complete' || changeInfo.url) && tab.active) {
        queueStateChange();
    }
});
chrome.windows.onFocusChanged.addListener(queueStateChange);
chrome.idle.onStateChanged.addListener(queueStateChange);


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

// --- Message Listener for Manual Trigger ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "send_report_now") {
        (async () => {
            try {
                await endSession(); // Save current session first
                const today = new Date().toISOString().split('T')[0];
                const result = await generateAndSendReport(today);
                sendResponse(result);
            } catch (e) {
                console.error("Manual report error:", e);
                sendResponse({ success: false, error: e.toString() });
            }
        })();
        return true; // Keep channel open for async response
    }
});

async function generateAndSendReport(dateString) {
    const key = `sessions-${dateString}`;
    const result = await chrome.storage.local.get([key]);
    const sessions = result[key] || [];

    if (sessions.length === 0) {
        console.log(`No sessions found for ${dateString}. Skipping report.`);
        return { success: false, error: "No activity recorded for today yet." };
    }

    // Aggregate by URL
    const summary = {};
    sessions.forEach(session => {
        // Normalize URL: Strip hash and query params for cleaner grouping (optional: keep query?)
        // User specifically asked to fix Gmail fragmentation which is hash-based.
        // Let's strip hash.
        let url = session.url;
        try {
            const urlObj = new URL(session.url);
            url = urlObj.origin + urlObj.pathname + urlObj.search; // Keep search, remove hash
        } catch (e) {
            // Fallback if URL parsing fails
            url = session.url.split('#')[0];
        }

        if (!summary[url]) {
            summary[url] = {
                title: session.title, // Keep the last title seen for this URL
                durationMs: 0,
                url: url
            };
        }
        summary[url].durationMs += session.durationMs;
    });

    // Sort by duration desc
    const sortedItems = Object.values(summary).sort((a, b) => b.durationMs - a.durationMs);

    // Get user info
    const userData = await chrome.storage.local.get(['userName', 'userEmail', 'userPhone']);
    const userName = userData.userName || 'Unknown';
    const userEmail = userData.userEmail || 'Not logged in';
    const userPhone = userData.userPhone || 'N/A';

    // Build text body
    let body = `Daily browsing report for ${dateString}\n\n`;
    body += `Name: ${userName}\n`;
    body += `Email: ${userEmail}\n`;
    body += `Phone: ${userPhone}\n`;
    body += `-----------------------------------\n\n`;

    sortedItems.forEach(item => {
        const hours = Math.floor(item.durationMs / 3600000);
        const minutes = Math.floor((item.durationMs % 3600000) / 60000);
        const seconds = Math.floor((item.durationMs % 60000) / 1000);

        const timeStr = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;

        body += `${timeStr} - ${item.title} (${item.url})\n`;
    });

    // Calculate and add total time
    const totalMs = sortedItems.reduce((sum, item) => sum + item.durationMs, 0);
    const totalHours = Math.floor(totalMs / 3600000);
    const totalMinutes = Math.floor((totalMs % 3600000) / 60000);
    const totalSeconds = Math.floor((totalMs % 60000) / 1000);
    const totalTimeStr = `${totalHours.toString().padStart(2, '0')}h ${totalMinutes.toString().padStart(2, '0')}m ${totalSeconds.toString().padStart(2, '0')}s`;

    body += `\n-----------------------------------\nTOTAL TIME: ${totalTimeStr}\n`;

    console.log("Sending report:", body);

    // Send to Webhook
    if (WEBHOOK_URL === "YOUR_WEBHOOK_URL_GOES_HERE") {
        console.error("Webhook URL not configured!");
        return { success: false, error: "Webhook URL not configured in background.js" };
    }

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: SECRET_TOKEN,
                date: dateString,
                body: body
            })
        });

        const text = await response.text();
        console.log("Webhook response:", text);

        if (!response.ok) {
            return { success: false, error: `Server error: ${response.status} ${response.statusText}` };
        }

        // Optional: Clear old data to save space
        // await chrome.storage.local.remove(key); // Keeping data for now in case of manual re-send

        return { success: true };

    } catch (e) {
        console.error("Failed to send report:", e);
        return { success: false, error: "Network error: " + e.message };
    }
}

