// rreplace here with AI model 
// Function to assign random risk levels for now
function getRiskLevel() {
    let risks = ["low", "medium", "high"];
    return risks[Math.floor(Math.random() * risks.length)];
}

// Get all links on the page
let links = document.querySelectorAll("a");

links.forEach(link => {
    let riskLevel = getRiskLevel();  // Simulate AI model risk assessment

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
        tooltipText = "WARNING: This link is HIGH risk (possible phishing).";
    }

    // Set title attribute (tooltip)
    link.setAttribute("title", tooltipText);
});
