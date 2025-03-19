function extractCiteLinks() {
    let cites = document.querySelectorAll("cite");
    let links = Array.from(cites)
        .map(cite => {
            let text = cite.innerText.trim(); // Get all text inside <cite>
            let match = text.match(/https?:\/\/[^\s>]+/); // Extract only the URL
            return match ? match[0] : null; // Return the URL or null if no match
        })
        .filter(link => link !== null); // Remove null values
    return [...new Set(links)]; // Remove duplicates
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getLinks") {
        let links = extractCiteLinks();
        sendResponse({ links: links });
    }
});

// Check website security (HTTPS and SSL)
async function checkSecurity(url) {
    let isSecure = url.startsWith("https");
    
    try {
        let response = await fetch(url, { method: "HEAD" });
        return { url, secure: isSecure, status: response.status === 200 };
    } catch (error) {
        return { url, secure: isSecure, status: false };
    }
}


