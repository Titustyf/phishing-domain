const GEMINI_API_KEY ='ABC123';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function run(websiteData) {
    const jsondata = {
        contents: [{
            parts:[{
                text: JSON.stringify(websiteData),
            }]
        }],
        systemInstruction: {
            parts:[{
                text:"You are an advanced AI-powered web security analysis engine. Your primary task is to evaluate the security posture of a website based on information provided to you in JSON format.  Your analysis should be thorough, accurate, and actionable, providing a security risk score and a detailed breakdown of potential vulnerabilities.",
            }]
        }
        // config: {
        //     responseMimeType: 'application/json',
        //     responseSchema:{
        //         type: "array",
        //         items: {
        //             type: "object",
        //             properties:{
        //                 'Security Risk Score':{
        //                     type: "string",
        //                     description: 'Security risk score of the website',
        //                     nullable: false,
        //                 },
        //                 'Potential Vulnerabilities':{
        //                     type: "string",
        //                     description: 'Potential vulnerabilities of the website',
        //                     nullable: true,
        //                 },
        //             },
        //             required: ['Security Risk Score','Potential Vulnerabilities'],
        //         },
        //     }
        // }
    }

    return fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body:JSON.stringify(jsondata)
    })
        .then(response => response.json())
        .then(data => {
            console.log("Gemini response:", data.candidates[0].content.parts[0].text);
            // return data.candidates[0].content.parts[0].text;
        })
        .catch((error) => {
            console.error('Error:',error);
            return {error:error.toString()};
        });
}

function getData () {
    const webdata = {
        title: document.title,
        metaDescription: document.querySelector("meta[name='description']")?.content || "N/A",
        contentSnippet: document.body.innerText.slice(0, 500),
        scripts: [...document.querySelectorAll("script")].map(s => s.src).filter(src => src)
    };
    return webdata;
}

// Function to extract website data
async function extractWebsiteData(tabId, url) {    
    return new Promise((resolve) => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: getData,
        }, 
        async (results) => {
            console.log("Extracted Page Data:", results);
            // Get cookies
            chrome.cookies.getAll({ url: url }, (cookies) => {
                // pageData.cookies = cookies.map(cookie => ({
                //     name: cookie.name,
                //     value: cookie.value,
                //     secure: cookie.secure,
                //     httpOnly: cookie.httpOnly,
                //     sameSite: cookie.sameSite
                // }));

                resolve({
                    url: url,
                    ...results[0]
                });
            });
        });
    });
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        console.log("Scanning website:", tab.url,"Tab id",tabId);
     
        // Extract data from the website
        let websiteData = await extractWebsiteData(tabId, tab.url);
        // Send the data to Gemini API for analysis
        console.log("calling gemini api");
        await run(websiteData);
    }
});