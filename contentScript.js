// contentScript.js
console.log("Reddit Bot Detection content script loaded");

const apiUrl = "https://c3c7-174-44-213-197.ngrok-free.app";

/////////////////////////////
// UI Helpers: Loading Indicator
/////////////////////////////
function showLoadingIndicator() {
  removeLoadingIndicator(); // remove any existing indicator
  const loadingDiv = document.createElement("div");
  loadingDiv.id = "shepherd-loading";
  loadingDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #2196F3;
    color: white;
    padding: 10px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 16px;
    text-align: center;
    border-bottom: 2px solid #1976D2;
  `;
  loadingDiv.textContent = "Analyzing... Please wait.";
  document.body.insertBefore(loadingDiv, document.body.firstChild);
}

function removeLoadingIndicator() {
  const loadingDiv = document.getElementById("shepherd-loading");
  if (loadingDiv && loadingDiv.parentNode) {
    loadingDiv.parentNode.removeChild(loadingDiv);
  }
}

/////////////////////////////
// UI Helper: Create Result Card
/////////////////////////////
function createResultDiv(result) {
  const div = document.createElement("div");
  div.id = "shepherd-result";
  div.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #fff;
    color: #333;
    padding: 20px;
    z-index: 10001;
    font-family: Arial, sans-serif;
    font-size: 16px;
    border: 2px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    max-width: 90%;
  `;

  let headerBg;
  if (result.bot_likelihood <= 30) {
    headerBg = "#C8E6C9"; // light green
  } else if (result.bot_likelihood <= 50) {
    headerBg = "#FFF9C4"; // light yellow
  } else {
    headerBg = "#FFCDD2"; // light red
  }

  const headerStyle = `
    background-color: ${headerBg};
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 10px;
    text-align: center;
    font-weight: bold;
  `;

  const contentHTML = `
    <div style="${headerStyle}">
      Bot Likelihood: ${result.bot_likelihood}%
    </div>
    <div style="margin-bottom: 10px;">
      <p><strong>Status:</strong> ${result.status}</p>
      <p><strong>Overall Assessment:</strong> ${result.status}</p>
    </div>
    <div>
      <p><strong>Content Analysis (${result.analysis.content_analysis.score}%):</strong> ${result.analysis.content_analysis.description}</p>
      <p><strong>Engagement (${result.analysis.engagement_with_users.score}%):</strong> ${result.analysis.engagement_with_users.description}</p>
      <p><strong>Profile Metadata (${result.analysis.profile_metadata.score}%):</strong> ${result.analysis.profile_metadata.description}</p>
    </div>
  `;

  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    background: #f44336;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
  `;
  closeButton.addEventListener("click", () => {
    div.remove();
  });

  div.innerHTML = contentHTML;
  div.appendChild(closeButton);
  return div;
}

/////////////////////////////
// Profile Data Extraction
/////////////////////////////
function extractProfileData() {
  console.log("Extracting profile data...");
  const profileData = {
    username: "",
    accountAge: "",
    postKarma: 0,
    commentKarma: 0,
    description: "",
    recentComments: [],
  };

  // Try several selectors for the username.
  const usernameSelectors = [
    'h1[class*="ProfileCard__username"]',
    'h1[class*="Header__username"]',
    'h1[class*="ProfileCard"] span',
    'h1[class*="Header"] span',
    "h1",
  ];
  for (let selector of usernameSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      profileData.username = element.textContent.trim();
      break;
    }
  }

  // Extract karma values.
  const karmaSelectors = [
    'span[id*="karma"]',
    'span[data-testid="karma-number"]',
    'div[class*="ProfileCard__karma"]',
  ];
  for (let selector of karmaSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length >= 2) {
      profileData.postKarma = parseInt(
        elements[0].textContent.replace(/,/g, ""),
        10
      );
      profileData.commentKarma = parseInt(
        elements[1].textContent.replace(/,/g, ""),
        10
      );
      break;
    }
  }

  // Extract account age.
  const ageSelectors = [
    'time[data-testid="cake-day"]',
    'span[id*="cake-day"]',
    'span[class*="ProfileCard__age"]',
    'div[data-testid="account-age"]',
  ];
  for (let selector of ageSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      profileData.accountAge = element.textContent.trim();
      break;
    }
  }

  // Extract profile description.
  const descriptionSelectors = [
    'p[data-testid="profile-description"]',
    'div[class*="ProfileCard__description"]',
    'div[class*="UserDescription"]',
  ];
  for (let selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      profileData.description = element.textContent.trim();
      break;
    }
  }

  // Extract recent comments.
  const commentSelectors = [
    "shreddit-comment",
    'article[data-testid="post-container"]',
    'div[data-testid="comment"]',
    'div[class*="Comment__"]',
    "div.md",
  ];
  for (let selector of commentSelectors) {
    const commentElements = document.querySelectorAll(selector);
    if (commentElements.length > 0) {
      commentElements.forEach((comment, index) => {
        if (index < 5) {
          // limit to 5 comments
          const commentText = comment.textContent.trim();
          const commentDate = comment.closest("article")
            ? comment
                .closest("article")
                .querySelector("faceplate-timeago time")
                ?.getAttribute("datetime")
            : null;
          const commentLink = comment.closest("article")
            ? comment
                .closest("article")
                .querySelector(
                  'a[data-click-id="body"], a[data-click-id="timestamp"]'
                )
                ?.getAttribute("href")
            : null;
          if (commentText) {
            profileData.recentComments.push({
              text: commentText,
              date: commentDate
                ? new Date(commentDate).toISOString()
                : "Unknown",
              link: commentLink ? `https://www.reddit.com${commentLink}` : "",
            });
          }
        }
      });
      break;
    }
  }

  console.log("Profile Data:", profileData);
  return profileData;
}

/////////////////////////////
// Main Initialization
/////////////////////////////
function init() {
  console.log("Initializing analysis...");
  showLoadingIndicator();
  const profileData = extractProfileData();

  if (profileData.username) {
    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: profileData }),
    })
      .then((response) => response.json())
      .then((result) => {
        console.log("Analysis result:", result);
        removeLoadingIndicator();
        const resultDiv = createResultDiv(result);
        document.body.appendChild(resultDiv);
      })
      .catch((error) => {
        console.error("Error during fetch:", error);
        removeLoadingIndicator();
        const errorResult = {
          bot_likelihood: 0,
          status: "Error: " + error.message,
          analysis: {
            content_analysis: { score: 0, description: "N/A" },
            engagement_with_users: { score: 0, description: "N/A" },
            profile_metadata: { score: 0, description: "N/A" },
          },
        };
        const resultDiv = createResultDiv(errorResult);
        document.body.appendChild(resultDiv);
      });
  } else {
    removeLoadingIndicator();
    const noDataResult = {
      bot_likelihood: 0,
      status: "Unable to extract profile data",
      analysis: {
        content_analysis: { score: 0, description: "N/A" },
        engagement_with_users: { score: 0, description: "N/A" },
        profile_metadata: { score: 0, description: "N/A" },
      },
    };
    const resultDiv = createResultDiv(noDataResult);
    document.body.appendChild(resultDiv);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

console.log("Content script execution complete");
