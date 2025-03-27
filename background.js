window.onload = function () {
    console.log("Script is loaded");
    let links = document.querySelectorAll("a[href]");
    let urls = Array.from(links).map(link => link.href);

    console.log("Extracted URLs:", urls); // Check if URLs are found

    chrome.runtime.sendMessage({ urls: urls }, (response) => {
        console.log("Background script response:", response);
    });
};
