// popup.js
document.getElementById("analyze").addEventListener("click", () => {
  const btn = document.getElementById("analyze");
  btn.disabled = true;
  btn.textContent = "Analyzing...";
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        files: ["contentScript.js"],
      },
      () => {
        // Close the popup so it doesn't overlay the page
        window.close();
      }
    );
  });
});
