//background.js

console.log("Background script running");

let latestAnalysisResult = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "setAnalysisResult") {
    latestAnalysisResult = message.result;

    // Open the popup
    if (message.openPopup) {
      chrome.windows.getCurrent((currentWindow) => {
        chrome.tabs.query(
          { active: true, windowId: currentWindow.id },
          (tabs) => {
            const currentTab = tabs[0];
            chrome.action.openPopup({
              windowId: currentWindow.id,
              tabId: currentTab.id,
            });
          }
        );
      });
    }

    // Send message to update popup if it's already open
    chrome.runtime.sendMessage({
      action: "updatePopup",
      result: latestAnalysisResult,
    });
  } else if (message.action === "getAnalysisResult") {
    sendResponse(analysisResult);
    console.log("Sent analysis result:", analysisResult);
  }
  return true; // Indicates asynchronous response
});

chrome.runtime.onInstalled.addListener(function () {
  console.log("Extension installed");
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    port.onMessage.addListener((message) => {
      if (message.action === "getAnalysisResult" && latestAnalysisResult) {
        port.postMessage({
          action: "updatePopup",
          result: latestAnalysisResult,
        });
      }
    });
  }
});
