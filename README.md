# WikiLite

**WikiLite** is a lightweight, modular Wikipedia client built with vanilla HTML, CSS, and JavaScript. It connects directly to the live [Wikipedia API](https://www.mediawiki.org/wiki/API:Main_page) to fetch real-time articles, while also supporting local user-created content.

> **Current Version:** v0.0.2
> **Status:** Alpha / Public Beta

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![JavaScript](https://img.shields.io/badge/JS-Vanilla-yellow)
![API](https://img.shields.io/badge/API-Wikipedia-orange)

## Features

*   **Live Wikipedia Integration:** Search and read millions of articles in real-time.
*   **Advanced Search:**
    *   **Autocomplete:** Real-time suggestions as you type.
    *   **Keyboard Navigation:** Use `Arrow Keys` and `Enter` to navigate suggestions.
    *   **"Did You Mean?":** Automatic spell-checking for misspelled queries.
    *   **Search Results Page:** Displays snippets if an exact match isn't found.
*   **Rich Media:**
    *   **Smart Image Gallery:** Automatically extracts and displays relevant images from articles.
    *   **Lightbox Modal:** Click images to view them in full size.
*   **User Experience:**
    *   **Dark Mode:** Toggle between light and dark themes (persists across sessions).
    *   **Mobile Responsive:** Fully optimized for smartphones with a collapsible sidebar.
    *   **Table of Contents:** Dynamic sidebar navigation for long articles.
    *   **History & Back Button:** Easy navigation through your browsing session.
*   **Local Content:** Create and edit your own "local" articles that persist in your browser's storage.

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

* [x] **v0.0.2**: Add Dark Mode toggle.
* [ ] **v0.0.3**: Offline support via Service Workers (PWA).
* [ ] **v0.0.4**: Save articles to `localStorage` for offline reading.
* [ ] **v0.0.5**: Multi-language support (switch between Wikipedia languages).
* [ ] **v1.0.0**: Progresive Web App (PWA) support for offline reading.

## License

This project is open-source and available under the [MIT License](LICENSE).

---
*Built with ❤ using Vanilla JS.*