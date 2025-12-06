// Check authentication on load
document.addEventListener('DOMContentLoaded', async () => {
    const authData = await chrome.storage.local.get(['isAuthenticated', 'userName', 'userEmail', 'userPhone']);

    if (!authData.isAuthenticated) {
        // Not logged in, redirect to auth
        window.location.href = 'auth.html';
        return;
    }

    // Show user info
    const userInfoDiv = document.getElementById('userInfo');
    const displayName = authData.userName || authData.userEmail || 'User';
    userInfoDiv.innerHTML = `👤 ${displayName}`;
    userInfoDiv.classList.remove('hidden');
});

// Send Report Button
document.getElementById('sendBtn').addEventListener('click', () => {
    const statusDiv = document.getElementById('status');
    const btn = document.getElementById('sendBtn');

    btn.disabled = true;
    btn.textContent = "Sending...";
    statusDiv.textContent = "";
    statusDiv.className = "";

    chrome.runtime.sendMessage({ action: "send_report_now" }, (response) => {
        btn.disabled = false;
        btn.textContent = "Send Report Now";

        if (chrome.runtime.lastError) {
            statusDiv.textContent = "Error: " + chrome.runtime.lastError.message;
            statusDiv.className = "error";
        } else if (response && response.success) {
            statusDiv.textContent = "Report sent successfully!";
            statusDiv.className = "success";
        } else {
            statusDiv.textContent = "Failed: " + (response?.error || "Unknown error");
            statusDiv.className = "error";
        }
    });
});

// Logout Button
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await chrome.storage.local.remove(['isAuthenticated', 'userName', 'userEmail', 'userPhone', 'userId']);
    window.location.href = 'auth.html';
});
