const GEMINI_API_KEY = 'ABC123';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

setInterval(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0) {
            const activeTab = tabs[0];
            const url = activeTab.url;
            
            // Proceed with analysis
            analyseJavaScript();
            analyseCookies();
            analyseLocalStorage();
        } else {
            console.error('No active tab found');
        }
    });
}, 5000);

// // Monitor network requests (all types)
// chrome.webRequest.onBeforeRequest.addListener(
//     (details) => {
//         // You can filter the details of the request based on the URL or type
//         checkNetworkRequest(details.url);
//     },
//     { urls: ["<all_urls>"] } // Listen to all URLs (adjust if necessary)
// );

// function analyseUrl(url) {
//     fetch(GEMINI_API_URL, {
//         method: 'GET',
//         headers: {
//             'Authorisation': `Bearer $(GEMINI_API_KEY)`,
//         },
//     })
//     .then(response => response.json())
//     .then(data => {
//         processGemini(data);
//     })
//     .catch(error => {
//         console.error('Error', error);
//     });
// }

function checkNetworkRequest(url) {
    // Send the URL of the network request to the Gemini API for analysis
    fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GEMINI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: url }),
    })
    .then(response => response.json())
    .then(data => {
        processGemini(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function analyseLocalStorage() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        // Inject a script to retrieve localStorage data from the active page
        chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: getLocalStorageData
        }, (results) => {
            // `results` will contain the data from the executed script
            const localStorageData = results[0].result;
            checkLocalStorage(localStorageData);
        });
    });
}

function getLocalStorageData() {
    const data = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        data.push(`${key}=${value}`);
    }
    return data.join("; ");
}

function checkLocalStorage(localStorageData) {
    // Send the local storage data to the Gemini API for analysis
    fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GEMINI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: localStorageData }),
    })
    .then(response => response.json())
    .then(data => {
        processGemini(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function analyseCookies() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        const url = activeTab.url;  // Get the URL of the active tab

        // Use the domain part of the URL for cookie retrieval
        const domain = new URL(url).hostname;

        chrome.cookies.getAll({ domain: domain }, (cookies) => {
            const cookiesList = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ");
            checkCookies(cookiesList);
        });
    });
}

function checkCookies(cookiesList) {
    // Send the cookies list to the Gemini API for analysis
    fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GEMINI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: cookiesList }),
    })
    .then(response => response.json())
    .then(data => {
        processGemini(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function analyseJavaScript() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];  // Ensure activeTab is correctly referenced
        chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: getScriptSources  // Pass the function that retrieves script sources
        }, (scripts) => {
            if (scripts && scripts[0] && scripts[0].result) {
                const scriptsList = scripts[0].result;
                checkJavaScript(scriptsList);
            } else {
                console.error('No scripts found on the page');
            }
        });
    });
}

function getScriptSources() {
    // Function that retrieves all script sources on the page
    return Array.from(document.scripts).map(script => script.src).join(", ");
}

function checkJavaScript(scriptsList) {
    // Send the scripts list to the Gemini API for analysis
    fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GEMINI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: scriptsList }),
    })
    .then(response => response.json())
    .then(data => {
        processGemini(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function alert() {
    chrome.notifications.create({
        type: "basic",
        title: "High-Risk Website Detected",
        message: "This site may contain phishing or malware. Proceed with caution.",
        priority: 2
    })
}

function processGemini(data) {
    const riskScore = data.risk_score;
    if (riskScore > 70) {
      alert();
    }
}