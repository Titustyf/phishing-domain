
loadModel();
async function loadModel() {
    // Load the TensorFlow.js model
    const model = await tf.loadLayersModel(chrome.runtime.getURL('model/model.json'));
    console.log("Model Loaded:", model);

    // Get all links on the page
    let links = document.querySelectorAll("a");

    links.forEach(link => {
        let url = link.href;
        
        if (url && url.trim() !== "") {
            try {
                let features = extractUrlFeatures(url);

                // Run the model prediction
                let predictionTensor = model.predict(features);
                let prediction = predictionTensor.dataSync();

                let riskLevel = 'low'; // Default to low risk
                if (prediction[0] > 0.7) {
                    riskLevel = 'high'; // High risk
                } else if (prediction[0] > 0.4) {
                    riskLevel = 'medium'; // Medium risk
                }

                // Set tooltip text
                let tooltipText = "";
                if (riskLevel === "low") {
                    link.style.color = "green";
                    tooltipText = "This link is LOW risk.";
                } else if (riskLevel === "medium") {
                    link.style.color = "orange";
                    tooltipText = "This link is MEDIUM risk. Be cautious.";
                } else if (riskLevel === "high") {
                    link.style.color = "red";
                    tooltipText = "WARNING: This link is HIGH risk (possible phishing)."
                      
                }

                // Set title attribute (tooltip)
                link.setAttribute("title", tooltipText);

            } catch (error) {
                console.error("Invalid URL:", url, error);
            }
        }

        
    });
};

function extractUrlFeatures(url) {
    const features = {};

    // General URL features
    features["qty_dot_url"] = (url.match(/\./g) || []).length;
    features["qty_hyphen_url"] = (url.match(/-/g) || []).length;
    features["qty_underline_url"] = (url.match(/_/g) || []).length;
    features["qty_slash_url"] = (url.match(/\//g) || []).length;
    features["qty_questionmark_url"] = (url.match(/\?/g) || []).length;
    features["qty_equal_url"] = (url.match(/=/g) || []).length;
    features["qty_at_url"] = (url.match(/@/g) || []).length;
    features["qty_and_url"] = (url.match(/&/g) || []).length;
    features["qty_exclamation_url"] = (url.match(/!/g) || []).length;
    features["qty_space_url"] = (url.match(/ /g) || []).length;
    features["qty_tilde_url"] = (url.match(/~/g) || []).length;
    features["qty_comma_url"] = (url.match(/,/g) || []).length;
    features["qty_plus_url"] = (url.match(/\+/g) || []).length;
    features["qty_asterisk_url"] = (url.match(/\*/g) || []).length;
    features["qty_hashtag_url"] = (url.match(/#/g) || []).length;
    features["qty_dollar_url"] = (url.match(/\$/g) || []).length;
    features["qty_percent_url"] = (url.match(/%/g) || []).length;
    features["qty_tld_url"] = url.split('.').pop().length;
    features["length_url"] = url.length;

    // Parse domain from URL
    let parsedUrl = new URL(url);
    let domain = parsedUrl.hostname;

    // Domain-related features
    features["qty_dot_domain"] = (domain.match(/\./g) || []).length;
    features["qty_hyphen_domain"] = (domain.match(/-/g) || []).length;
    features["qty_underline_domain"] = (domain.match(/_/g) || []).length;
    features["qty_slash_domain"] = (domain.match(/\//g) || []).length;
    features["qty_questionmark_domain"] = (domain.match(/\?/g) || []).length;
    features["qty_equal_domain"] = (domain.match(/=/g) || []).length;
    features["qty_at_domain"] = (domain.match(/@/g) || []).length;
    features["qty_and_domain"] = (domain.match(/&/g) || []).length;
    features["qty_exclamation_domain"] = (domain.match(/!/g) || []).length;
    features["qty_space_domain"] = (domain.match(/ /g) || []).length;
    features["qty_tilde_domain"] = (domain.match(/~/g) || []).length;
    features["qty_comma_domain"] = (domain.match(/,/g) || []).length;
    features["qty_plus_domain"] = (domain.match(/\+/g) || []).length;
    features["qty_asterisk_domain"] = (domain.match(/\*/g) || []).length;
    features["qty_hashtag_domain"] = (domain.match(/#/g) || []).length;
    features["qty_dollar_domain"] = (domain.match(/\$/g) || []).length;
    features["qty_percent_domain"] = (domain.match(/%/g) || []).length;
    features["qty_vowels_domain"] = domain.split('').filter(c => 'aeiou'.includes(c)).length;
    features["domain_length"] = domain.length;

    features["server_client_domain"] = (domain.includes("server") || domain.includes("client")) ? 1 : 0;

    // Path-related features
    let directory = parsedUrl.pathname;
    features["qty_dot_directory"] = (directory.match(/\./g) || []).length;
    features["qty_hyphen_directory"] = (directory.match(/-/g) || []).length;
    features["qty_underline_directory"] = (directory.match(/_/g) || []).length;
    features["qty_slash_directory"] = (directory.match(/\//g) || []).length;
    features["qty_questionmark_directory"] = (directory.match(/\?/g) || []).length;
    features["qty_equal_directory"] = (directory.match(/=/g) || []).length;
    features["qty_at_directory"] = (directory.match(/@/g) || []).length;
    features["qty_and_directory"] = (directory.match(/&/g) || []).length;
    features["qty_exclamation_directory"] = (directory.match(/!/g) || []).length;
    features["qty_space_directory"] = (directory.match(/ /g) || []).length;
    features["qty_tilde_directory"] = (directory.match(/~/g) || []).length;
    features["qty_comma_directory"] = (directory.match(/,/g) || []).length;
    features["qty_plus_directory"] = (directory.match(/\+/g) || []).length;
    features["qty_asterisk_directory"] = (directory.match(/\*/g) || []).length;
    features["qty_hashtag_directory"] = (directory.match(/#/g) || []).length;
    features["qty_dollar_directory"] = (directory.match(/\$/g) || []).length;
    features["qty_percent_directory"] = (directory.match(/%/g) || []).length;
    features["directory_length"] = directory.length;

    // File-related features
    let filePart = parsedUrl.pathname.split("/").pop();
    features["qty_dot_file"] = (filePart.match(/\./g) || []).length;
    features["qty_hyphen_file"] = (filePart.match(/-/g) || []).length;
    features["qty_underline_file"] = (filePart.match(/_/g) || []).length;
    features["qty_slash_file"] = (filePart.match(/\//g) || []).length;
    features["qty_questionmark_file"] = (filePart.match(/\?/g) || []).length;
    features["qty_equal_file"] = (filePart.match(/=/g) || []).length;
    features["qty_at_file"] = (filePart.match(/@/g) || []).length;
    features["qty_and_file"] = (filePart.match(/&/g) || []).length;
    features["qty_exclamation_file"] = (filePart.match(/!/g) || []).length;
    features["qty_space_file"] = (filePart.match(/ /g) || []).length;
    features["qty_tilde_file"] = (filePart.match(/~/g) || []).length;
    features["qty_comma_file"] = (filePart.match(/,/g) || []).length;
    features["qty_plus_file"] = (filePart.match(/\+/g) || []).length;
    features["qty_asterisk_file"] = (filePart.match(/\*/g) || []).length;
    features["qty_hashtag_file"] = (filePart.match(/#/g) || []).length;
    features["qty_dollar_file"] = (filePart.match(/\$/g) || []).length;
    features["qty_percent_file"] = (filePart.match(/%/g) || []).length;
    features["file_length"] = filePart.length;

    // Query-related features
    let params = parsedUrl.search;
    features["qty_dot_params"] = (params.match(/\./g) || []).length;
    features["qty_hyphen_params"] = (params.match(/-/g) || []).length;
    features["qty_underline_params"] = (params.match(/_/g) || []).length;
    features["qty_slash_params"] = (params.match(/\//g) || []).length;
    features["qty_questionmark_params"] = (params.match(/\?/g) || []).length;
    features["qty_equal_params"] = (params.match(/=/g) || []).length;
    features["qty_at_params"] = (params.match(/@/g) || []).length;
    features["qty_and_params"] = (params.match(/&/g) || []).length;
    features["qty_exclamation_params"] = (params.match(/!/g) || []).length;
    features["qty_space_params"] = (params.match(/ /g) || []).length;
    features["qty_tilde_params"] = (params.match(/~/g) || []).length;
    features["qty_comma_params"] = (params.match(/,/g) || []).length;
    features["qty_plus_params"] = (params.match(/\+/g) || []).length;
    features["qty_asterisk_params"] = (params.match(/\*/g) || []).length;
    features["qty_hashtag_params"] = (params.match(/#/g) || []).length;
    features["qty_dollar_params"] = (params.match(/\$/g) || []).length;
    features["qty_percent_params"] = (params.match(/%/g) || []).length;
    features["params_length"] = params.length;

    const tlds = ["com", "net", "org", "edu", "gov", "io", "co", "tv"];
    features["tld_present_params"] = tlds.some(tld => params.includes(tld)) ? 1 : 0;
    features["qty_params"] = params ? params.split("&").length : 0;
    features["email_in_url"] = url.includes('@') ? 1 : 0;
    let shortenedDomains = ["bit.ly", "goo.gl", "t.co", "tinyurl.com"];
    features["url_shortened"] = shortenedDomains.some(domain => url.includes(domain)) ? 1 : 0;

    return tf.tensor(Object.values(features)).reshape([1, Object.keys(features).length]);
}