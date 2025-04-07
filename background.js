import googleanalytic from "./googleanalytic.js";

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
        googleanalytic.recordlink(currentUrl,securityRiskScore,potentialVulnerabilities);
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
    const GEMINI_API_KEY ='AIzaSyCYoEMepJKGwJH8oNcToIDhnOAucCmpw28';
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



// const MEASUREMENT_ID = 'G-G7KGDP2W65';
// const API_SECRET = 'ite_6K2IST-Zb6urAVfFsw';
// const CLIENT_ID = crypto.randomUUID(); // Persist this if you want consistent tracking

// class Analytics {
//     constructor(debug = false) {
//       this.debug = debug;
//     }
  
//     // Returns the client id, or creates a new one if one doesn't exist.
//     // Stores client id in local storage to keep the same client id as long as
//     // the extension is installed.
//     async getOrCreateClientId() {
//       let { clientId } = await chrome.storage.local.get('clientId');
//       if (!clientId) {
//         // Generate a unique client ID, the actual value is not relevant
//         clientId = self.crypto.randomUUID();
//         await chrome.storage.local.set({ clientId });
//       }
//       return clientId;
//     }
  
//     // Returns the current session id, or creates a new one if one doesn't exist or
//     // the previous one has expired.
//     async getOrCreateSessionId() {
//       // Use storage.session because it is only in memory
//       let { sessionData } = await chrome.storage.session.get('sessionData');
//       const currentTimeInMs = Date.now();
//       // Check if session exists and is still valid
//       if (sessionData && sessionData.timestamp) {
//         // Calculate how long ago the session was last updated
//         const durationInMin = (currentTimeInMs - sessionData.timestamp) / 60000;
//         // Check if last update lays past the session expiration threshold
//         if (durationInMin > SESSION_EXPIRATION_IN_MIN) {
//           // Clear old session id to start a new session
//           sessionData = null;
//         } else {
//           // Update timestamp to keep session alive
//           sessionData.timestamp = currentTimeInMs;
//           await chrome.storage.session.set({ sessionData });
//         }
//       }
//       if (!sessionData) {
//         // Create and store a new session
//         sessionData = {
//           session_id: currentTimeInMs.toString(),
//           timestamp: currentTimeInMs.toString()
//         };
//         await chrome.storage.session.set({ sessionData });
//       }
//       return sessionData.session_id;
//     }
  
  
//   async sendAnalyticsEvent(eventName, eventParams = {}) {
//     if (!CLIENT_ID) return; // Wait until client_id is initialized
//     if (!eventParams.session_id) {
//         eventParams.session_id = await this.getOrCreateSessionId();
//       }
//       if (!eventParams.engagement_time_msec) {
//         eventParams.engagement_time_msec = DEFAULT_ENGAGEMENT_TIME_MSEC;
//       }
//     fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`, {
//       method: 'POST',
//       body: JSON.stringify({
//         client_id: CLIENT_ID,
//         events: [
//           {
//             name: eventName,
//             params: eventParams
//           }
//         ]
//       }),
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     });
//   }
  
//   // 👇 Export this function
//   const analytics = {
//     firePhishingDetected: function (riskLevel, url) {
//       try {
//         const domain = new URL(url).hostname;
  
//         let risk_score = 0;
//         if (riskLevel === "high") risk_score = 0.9;
//         else if (riskLevel === "medium") risk_score = 0.6;
//         else risk_score = 0.2;
  
//         sendAnalyticsEvent('phishing_detected', {
//           domain: domain,
//           risk_level: riskLevel,
//           risk_score: risk_score,
//           full_url: url
//         });
//       } catch (e) {
//         console.error("Analytics tracking failed:", e);
//       }
//     }
//   }

//   export default new Analytics();