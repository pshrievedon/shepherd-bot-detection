# Shepherd: AI-Driven Bot Detection Tool

Shepherd is a browser extension designed to detect bots in online spaces, starting with platforms like Reddit and Twitter. By analyzing user profiles, it provides a likelihood score of an account being a bot, empowering users to discern authentic perspectives from bot-generated content.

## Features

- **Profile Analysis**: Evaluates user content, engagement patterns, and metadata to determine bot likelihood.
- **Simple Interface**: A clean, user-friendly browser extension displaying bot scores at a glance.
- **Privacy-First**: Processes public data anonymously and complies with privacy regulations like GDPR.
- **Scalable Architecture**: Combines local processing (browser extension) with secure cloud-based analytics.

## How It Works

1. The extension gathers public profile data from platforms like Reddit.
2. The data is sent to an API, which performs analysis using AI techniques such as:
   - Content analysis
   - Engagement behavior
   - Profile metadata review.
3. Results are returned to the extension and displayed as a bot likelihood score.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **AI/ML**: Integrates foundation models and behavioral analysis
- **APIs**: Custom-built for bot detection
- **Hosting**: Cloud-hosted services for API and analytics

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/pshrievedon/shepherd-bot-detection.git
