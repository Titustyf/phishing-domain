document.addEventListener("DOMContentLoaded", () => {
    let extractButton = document.getElementById("extract");

    if (extractButton) {
        extractButton.addEventListener("click", () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: "getLinks" }, (response) => {
                    if (response && response.links) {
                        let output = document.getElementById("output");
                        output.innerHTML = ""; // Clear previous results

                        response.links.forEach(link => {
                            let status = link.status ? "✅ Secure" : "❌ Insecure";
                            let color = link.secure ? "green" : "red";
                            output.innerHTML += `<p><a href="${link.url}" target="_blank">${link.url}</a> - <span style="color:${color}; font-weight:bold;">${status}</span></p>`;
                        });
                    }
                });
            });
        });
    } else {
        console.error("Button with id 'extract' not found!");
    }
});

