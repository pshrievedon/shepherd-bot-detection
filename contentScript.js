console.log("Reddit Bot Detection content script loaded");

function createResultDiv(result) {
  const div = document.createElement("div");
  div.id = "reddit-bot-detection-result";

  // Determine background color based on bot likelihood
  let backgroundColor;
  if (result.bot_likelihood <= 30) {
    backgroundColor = "#4CAF50"; // Green
  } else if (result.bot_likelihood <= 50) {
    backgroundColor = "#FFEB3B"; // Yellow
  } else {
    backgroundColor = "#F44336"; // Red
  }

  div.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background-color: ${backgroundColor};
        color: ${result.bot_likelihood <= 50 ? "black" : "white"};
        padding: 10px;
        z-index: 9999;
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;

  const content = `
        <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
                <p style="font-weight: bold; margin: 0 0 10px 0;">Bot Likelihood: ${result.bot_likelihood}%</p>
                <p style="margin: 0 0 10px 0;"><strong>Status:</strong> ${result.status}</p>
                <p style="margin: 0 0 10px 0;"><strong>Overall Assessment:</strong> ${result}</p>
            </div>
            <div style="flex: 1;">
                <p style="margin: 0 0 5px 0;"><strong>Content Analysis (${result.analysis.content_analysis.score}%):</strong> ${result.analysis.content_analysis.description}</p>
                <p style="margin: 0 0 5px 0;"><strong>Engagement (${result.analysis.engagement_with_users.score}%):</strong> ${result.analysis.engagement_with_users.description}</p>
                <p style="margin: 0 0 5px 0;"><strong>Profile Metadata (${result.analysis.profile_metadata.score}%):</strong> ${result.analysis.profile_metadata.description}</p>
            </div>
        </div>
    `;

  const closeButton = document.createElement("button");
  closeButton.textContent = "X";
  closeButton.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: none;
        border: none;
        color: ${result.bot_likelihood <= 50 ? "black" : "white"};
        font-size: 16px;
        cursor: pointer;
    `;
  closeButton.onclick = () => div.remove();

  div.innerHTML = content;
  div.appendChild(closeButton);

  return div;
}

// Extract profile data logic (unchanged)
function extractProfileData() {
  console.log("Attempting to extract profile data");

  const profileData = {
    username: "",
    accountAge: "",
    postKarma: 0,
    commentKarma: 0,
    description: "",
    recentComments: [],
  };

  // Username selectors (keep existing strategy)
  const usernameSelectors = [
    'h1[class*="ProfileCard__username"]',
    'h1[class*="Header__username"]',
    'h1[class*="ProfileCard"] span',
    'h1[class*="Header"] span',
    "h1", // Fallback to any h1 tag
  ];

  for (let selector of usernameSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      profileData.username = element.textContent.trim();
      console.log(`Username found with selector: ${selector}`);
      console.log("Username extracted:", profileData.username);
      break;
    }
  }

  // Karma selectors
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
      console.log(
        "Karma extracted:",
        profileData.postKarma,
        profileData.commentKarma
      );
      break;
    }
  }

  // Account age selectors
  const ageSelectors = [
    'time[data-testid="cake-day"]',
    'span[id*="cake-day"]',
    'span[class*="ProfileCard__age"]',
    'div[data-testid="account-age"]',
  ];

  for (let selector of ageSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      profileData.accountAge = element.textContent.trim();
      console.log("Account age extracted:", profileData.accountAge);
      break;
    }
  }

  // Description selectors
  const descriptionSelectors = [
    'p[data-testid="profile-description"]',
    'div[class*="ProfileCard__description"]',
    'div[class*="UserDescription"]',
  ];

  for (let selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      profileData.description = element.textContent.trim();
      console.log("Description extracted:", profileData.description);
      break;
    }
  }

  console.log("Attempting to extract recent comments");
  profileData.recentComments = [];

  // New comment selectors based on the provided HTML
  const commentSelectors = [
    "shreddit-comment",
    'article[data-testid="post-container"]',
    'div[data-testid="comment"]',
    'div[class*="Comment__"]',
    "div.md", // This selector targets the comment content in the provided HTML
  ];

  for (let selector of commentSelectors) {
    console.log(`Trying selector: ${selector}`);
    const commentElements = document.querySelectorAll(selector);
    console.log(
      `Found ${commentElements.length} elements with selector ${selector}`
    );

    if (commentElements.length > 0) {
      commentElements.forEach((comment, index) => {
        if (index < 5) {
          // Limit to 5 recent comments
          const commentText = comment.textContent.trim();
          const commentDate = comment
            .closest("article")
            ?.querySelector("faceplate-timeago time")
            ?.getAttribute("datetime");
          const commentLink = comment
            .closest("article")
            ?.querySelector(
              'a[data-click-id="body"], a[data-click-id="timestamp"]'
            )
            ?.getAttribute("href");

          console.log(`Comment ${index + 1}:`);
          console.log("Text:", commentText);
          console.log("Date:", commentDate);
          console.log("Link:", commentLink);

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
      console.log("Recent comments extracted:", profileData.recentComments);
      break;
    }
  }

  if (profileData.recentComments.length === 0) {
    console.log("No comments found with any selector");
  }

  console.log("Full profile data:", profileData);
  return profileData;
}

// Initialize the content script
function init() {
  console.log("Initializing content script");
  const profileData = extractProfileData();
  if (profileData.username) {
    console.log("Valid profile data found, proceeding with analysis");

    fetch(
      "https://d7b8b372-7e2f-44d6-8b57-4629ecbc2928-00-2jv98073st6zi.kirk.replit.dev/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: profileData,
        }),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        var res = parseJsonString(data.response);
        console.log("Success:", res);
        const resultDiv = createResultDiv(res);
        document.body.insertBefore(resultDiv, document.body.firstChild);
      })
      .catch((error) => {
        console.error("Error:", error);
        const errorResult = {
          bot_likelihood: 0,
          status: "Error: " + error.message,
          analysis: {
            content_analysis: 0,
            engagement_with_users: 0,
            profile_metadata: 0,
          },
        };
        const resultDiv = createResultDiv(errorResult);
        document.body.insertBefore(resultDiv, document.body.firstChild);
      });
  } else {
    console.log("No valid profile data found");
    const noDataResult = {
      bot_likelihood: 0,
      status: "Unable to extract profile data",
      analysis: {
        content_analysis: 0,
        engagement_with_users: 0,
        profile_metadata: 0,
      },
    };
    const resultDiv = createResultDiv(noDataResult);
    document.body.insertBefore(resultDiv, document.body.firstChild);
  }
}

// Run the script when the page is fully loaded
if (document.readyState === "loading") {
  console.log("Document still loading, adding DOMContentLoaded listener");
  document.addEventListener("DOMContentLoaded", init);
} else {
  console.log("Document already loaded, running init immediately");
  init();
}

console.log("Content script setup complete");

// Function to clean and parse the JSON
function parseJsonString(markdownString) {
  // Remove the markdown formatting
  const cleanedString = markdownString.replace(/```json|```|\[|\]/g, "").trim();
  // Parse the cleaned JSON string
  try {
    const parsedJson = JSON.parse(cleanedString);
    console.log(parsedJson);
    return parsedJson; // return the parsed object if needed
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }
}
