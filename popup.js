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
            statusDiv.textContent = "Failed to send report. Check console.";
            statusDiv.className = "error";
        }
    });
});
