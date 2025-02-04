document.addEventListener('DOMContentLoaded', function() {
    const loader = document.getElementById('loader');
    const analysisResult = document.getElementById('analysis-result');
    
    // Initially hide the result and display the loader
    analysisResult.style.display = 'none';
    loader.style.display = 'block';

    // Function to update the UI with analysis results
    function updateUI(result) {
        console.log("Updating UI with result:", result);
        document.getElementById('bot-likelihood').textContent = result.bot_likelihood + '%';
        document.getElementById('status-description').textContent = result.status;

        // Update progress bars
        document.getElementById('content-bar').style.width = `${result.analysis.content_analysis}%`;
        document.getElementById('engagement-bar').style.width = `${result.analysis.engagement_with_users}%`;
        document.getElementById('profile-bar').style.width = `${result.analysis.profile_metadata}%`;

        // Hide loader and show results
        loader.style.display = 'none';
        analysisResult.style.display = 'block';
    }

    // Function to display error messages
    function displayError(message) {
        console.error("Displaying error:", message);
        loader.style.display = 'none';
        analysisResult.innerHTML = `<p>Error: ${message}</p>`;
        analysisResult.style.display = 'block';
    }

    // Request analysis from the content script
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        // Sending a message to the content script
        chrome.tabs.sendMessage(tabs[0].id, { action: "getAnalysis" }, function(response) {
            if (chrome.runtime.lastError) {
                console.error("Error connecting to content script:", chrome.runtime.lastError);
                displayError("Could not connect to the page. Make sure you are on a Reddit user profile.");
            } else {
                console.log("Message successfully sent to content script.");
                // Once content script responds, request the analysis result from the background
                chrome.runtime.sendMessage({ action: "getAnalysisResult" }, function(result) {
                    if (result) {
                        console.log("Received analysis result from background:", result);
                        updateUI(result);
                    } else {
                        displayError("No analysis result available");
                    }
                });
            }
        });
    });

    // Listen for updatePopup message
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "updatePopup") {
            updatePopupWithResult(message.result);
        }
    });

    // Function to update popup UI with result
    function updatePopupWithResult(result) {
        // Update your popup UI here
        document.getElementById('bot-likelihood').textContent = result.bot_likelihood + '%';
        document.getElementById('content-analysis').textContent = result.analysis.content_analysis + '%';
        document.getElementById('engagement').textContent = result.analysis.engagement_with_users + '%';
        document.getElementById('profile-metadata').textContent = result.analysis.profile_metadata + '%';
        document.getElementById('status').textContent = result.status;
    }

    // Also, when the popup is opened, check for stored results
    chrome.storage.local.get('analysisResult', (data) => {
        if (data.analysisResult) {
            updatePopupWithResult(data.analysisResult);
        }
    });

    // Connect to the popup
    let port = chrome.runtime.connect({name: "popup"});

    // Listen for updatePopup message
    port.onMessage.addListener((message) => {
        if (message.action === "updatePopup") {
            updatePopupWithResult(message.result);
        }
    });

    // Request the latest result when popup opens
    port.postMessage({action: "getAnalysisResult"});

    // Request the latest result as soon as the popup opens
    document.addEventListener('DOMContentLoaded', () => {
        port.postMessage({action: "getAnalysisResult"});
    });
});
