# WikiLite

**WikiLite** is a lightweight, modular Wikipedia client built with vanilla HTML, CSS, and JavaScript. It connects directly to the live [Wikipedia API](https://www.mediawiki.org/wiki/API:Main_page) to fetch real-time articles, while also supporting local user-created content.

> **Current Version:** v0.0.1
> **Status:** Alpha / Public Beta

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![JavaScript](https://img.shields.io/badge/JS-Vanilla-yellow)

## Features

* **Live Wikipedia Integration:** Search and read millions of articles from Wikipedia in real-time.
* **Smart Navigation:**
	* Click internal links (e.g., `<a href="/wiki/HTML">`) to navigate without leaving the app.
	* "Back" button history stack.
	* Dynamic sidebar showing recent browsing history.
* **Local Content Creation:** Create and edit your own "local" articles that persist during the session.
* **Random Article:** Discover new topics with one click.
* **Responsive Design:** Clean, encyclopedia-style layout that works on desktop and mobile.

## Live Demo

Check out the live version hosted on GitHub Pages:
**[https://codewithzaqar.github.io/wikilite/]**

## Installation & Local Development

Since WikiLite uses the `fetch` API to connect to Wikipedia, **you must run it on a local server** due to browser CORS policies. You cannot just open `index.html` directly from your file explorer.

### Prerequisites
* A modern web browser (Chrome, Firefox, Edge).
* A code editor (VS Code recommended).

### Option 1: VS Code Live Server (Recommended)
1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.vscode-live-server) extension in VS Code.
2. Open the project folder.
3. Right-click `index.html` and select **"Open with Live Server"**.

### Option 2: Python
If you have Python installed:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

### Option 3: Node.js
If you have Node.js installed:
```bash
npx http-server
```

## Project Structure

```text
wikilite/
|
|---index.html   # Main structure
|---style.css    # Styling and layout
|---api.js       # Wikipedia API connector & Mock DB
|---app.js       # Application logic & UI controller
|---README.md    # Project documentation
```

## How it Works

1. **`api.js`**: Handles all network requests to `https://en.wikipedia.org/w/api.php`. It parses JSON responses and strips HTML tags from titles for clean display. It also manages a temporary local database for user-created articles.
2. **`app.js`**: Manages the state (current article, history stack). It listens for clicks on internal Wikipedia links (`/wiki/...`) and intercepts them to load content dynamically instead of navigating away.
3. **`style.css`**: Provides a clean, readable typography similar to Wikipedia, with a responsive sidebar.

## Roadmap

* [ ] **v0.0.2**: Add Dark Mode toggle.
* [ ] **v0.0.3**: Save local articles to `localStorage` so they persist after refresh.
* [ ] **v0.0.4**: Add Table of Contents parsing for long articles.
* [ ] **v1.0.0**: Progresive Web App (PWA) support for offline reading.

## License

This project is open-source and available under the [MIT License](LICENSE).

---
*Built with ❤ using Vanilla JS.*