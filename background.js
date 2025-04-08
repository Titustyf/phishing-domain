chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension Installed");
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        let currentUrl = new URL(tab.url).origin;

        let webData = await getWebData(tabId, currentUrl);
        console.log("Congrats:", webData);

        const response = JSON.parse(await callGemini(webData))[0];
        console.log("The response:", response);

        const securityRiskScore = response["Security Risk Score"];
        const potentialVulnerabilities = response["Potential Vulnerabilities"];
        showNotification(securityRiskScore, potentialVulnerabilities);
        console.log("Done");
    }
});

//Function to show notification from Gemini's responses
function showNotification(securityRiskScore, potentialVulnerabilities) {
    const message = `Risk Score: ${securityRiskScore}\nVulnerabilities: ${potentialVulnerabilities}`;
    
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Website Security Check",
        message: message,
        priority: 2
    });
}

//Function to Call Gemini API
async function callGemini(webData){
    const GEMINI_API_KEY ='AIzaSyAYWPn7wM3LBdnCVjthQffbSJ2IX9SXx2Q';
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const input = structuredinput(webData);
    return fetch (GEMINI_API_URL, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body:JSON.stringify(input)
    })
        .then(response => response.json())
        .then(data => {
            // console.log("Gemini response:", data.candidates[0].content.parts[0]);
            console.log("Gemini response:", data);
            return data.candidates[0].content.parts[0].text;
        })
        .catch((error) => {
            console.error('Error:',error);
            return {error:error.toString()};
        });
}

//Function to structured input for calling gemini
function structuredinput(webData){
    const jsondata = {
        contents: [{
            parts:[{
                text: JSON.stringify(webData),
            }]
        }],
        systemInstruction: {
            parts:[{
                text:"You are an advanced AI-powered web security analysis engine. Your primary task is to evaluate the security posture of a website based on information provided to you in JSON format.  Your analysis should be thorough, accurate, and actionable, providing a security risk score and a detailed breakdown of potential vulnerabilities.",
            }]
        },
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema:{
                type: "array",
                items: {
                    type: "object",
                    properties:{
                        'Security Risk Score':{
                            type: "string",
                            description: 'Security risk score of the website from 1 to 10',
                            nullable: false,
                        },
                        'Potential Vulnerabilities':{
                            type: "string",
                            description: 'List the potential vulnerabilities of the website without description and separated by comma',
                            nullable: true,
                        },
                    },
                    required: ['Security Risk Score','Potential Vulnerabilities'],
                },
            }
        }
    }
    return jsondata;
}

//Function to combine extracted data
async function getWebData(tabId, url){
    //Fetch website data and cookies
    let websiteData = await extractScript(tabId);
    let cookies = await getCookies(url);

    //Combine the data
    let combinedData ={
        url: url,
        websiteData: websiteData,
        cookies: cookies
    };

    console.log('Combined Data:', combinedData);
    return combinedData;
}

// Function to inject script and extract website data
function extractScript(tabId) {
    return new Promise((resolve) => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: extractWebsiteData
        }, (results) => {
            console.log("Extracted Data:", results[0]?.result);
            resolve(results[0]?.result || {});
        });
    });
}

// Function that runs inside the webpage to extract website data
function extractWebsiteData() {
    return {
        title: document.title,
        metaDescription: document.querySelector("meta[name='description']")?.content || "N/A",
        scripts: [...document.querySelectorAll("script")].map(s => s.src).filter(src => src)
    };
}

// Function to get cookies
function getCookies(url) {
    return new Promise((resolve) =>{
        chrome.cookies.getAll({ url: url }, (cookies) => {
            if (chrome.runtime.lastError) {
                console.error("Error getting cookies:", chrome.runtime.lastError);
                resolve([]);
            } else {
                console.log(`Cookies for ${url}:`, cookies);
                resolve(cookies);
            }
        });
    });
}