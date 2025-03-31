const GEMINI_API_KEY ='ABC123';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function run(websiteData) {

    const data = {
        contents: [{
            parts:[{
                text: websiteData,
            }]
        }],
        config: {
            responseMimeType: 'application/json',
            responseSchema:{
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties:{
                        'Security Risk Score':{
                            type: Type.STRING,
                            description: 'Security risk score of the website',
                            nullable: false,
                        },
                        'Potential Vulnerabilities':{
                            type: Type.STRING,
                            description: 'Potential vulnerabilities of the website',
                            nullable: true,
                        },
                    },
                    required: ['Security Risk Score','Potential Vulnerabilities'],
                },
            },
            systemInstruction: {
                parts:[{
                    text:"You are an advanced AI-powered web security analysis engine. Your primary task is to evaluate the security posture of a website based on information provided to you in JSON format.  Your analysis should be thorough, accurate, and actionable, providing a security risk score and a detailed breakdown of potential vulnerabilities.",
                }]
            }
        }
    }

    return fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body:JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            return data.candidates[0].content.parts[0].text;
        })
        .catch((error) => {
            console.error('Error:',error);
            return {error:error.toString()};
        });
}

function getData () {
    console.log('Start extract');
    const webdata = {
        title: document.title,
        metaDescription: document.querySelector("meta[name='description']")?.content || "N/A",
        contentSnippet: document.body.innerText.slice(0, 500),
        scripts: [...document.querySelectorAll("script")].map(s => s.src).filter(src => src)
    };
    console.log('finish extract', data);
    return data;
}

// Function to extract website data
async function extractWebsiteData(tabId, url) {
    return new Promise((resolve) => {
        console.log('hihi');
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: getData,
        }, 
        async (results) => {
            let pageData = results[0].result;
            console.log("Extracted Page Data:", pageData);
            // Get cookies
            chrome.cookies.getAll({ url: url }, (cookies) => {
                pageData.cookies = cookies.map(cookie => ({
                    name: cookie.name,
                    value: cookie.value,
                    secure: cookie.secure,
                    httpOnly: cookie.httpOnly,
                    sameSite: cookie.sameSite
                }));

                resolve({
                    url: url,
                    ...pageData
                });
            });
        });
    });
}

// Function to send data to Gemini API
async function analyzeWithGemini(websiteData) {
    console.log("Analyzing with Gemini:", websiteData);

    const apiKey = "YOUR_GEMINI_API_KEY";
    const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" + apiKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `Analyze this website for security risks: ${JSON.stringify(websiteData)}` }] }]
        })
    });

    const result = await response.json();
    console.log("Gemini Response:", result);
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        console.log("Scanning website:", tab.url,"Tab id",tabId);

        // Extract data from the website
        let websiteData = await extractWebsiteData(tabId, tab.url);
        // Send the data to Gemini API for analysis
        await run(websiteData);;
    }
});
