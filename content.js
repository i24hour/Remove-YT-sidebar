function hideSidebar() {
    const sidebar = document.querySelector('#related');
    if (sidebar) {
        sidebar.style.display = "none";
    }
    // Also try to hide the related chip cloud if present
    const relatedChips = document.querySelector('#related-chips');
    if (relatedChips) {
        relatedChips.style.display = "none";
    }
}

// Run immediately
hideSidebar();

// Run on mutations to handle dynamic loading (SPA navigation)
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
            hideSidebar();
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });
