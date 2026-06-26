/**
 * WikiLite Real Wikipedia API Connector
 * v0.0.1a05b (Patch: Fix HTML in titles)
 */

const WIKI_API_URL = "https://en.wikipedia.org/w/api.php";

// Helper to remove HTML tags from strings
function stripHtmlTags(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

async function apiSearchArticles(query) {
    const params = new URLSearchParams({
        action: "query",
        list: "search",
        srsearch: query,
        format: "json",
        origin: "*" 
    });

    try {
        const response = await fetch(`${WIKI_API_URL}?${params}`);
        const data = await response.json();
        
        if (data.query && data.query.search) {
            return data.query.search.map(item => ({
                id: item.pageid.toString(),
                title: item.title // Search results usually come clean, but good to be safe
            }));
        }
        return [];
    } catch (error) {
        console.error("API Search Error:", error);
        return [];
    }
}

async function apiGetArticleByTitle(title) {
    const params = new URLSearchParams({
        action: "parse",
        page: title,
        format: "json",
        origin: "*",
        prop: "text|displaytitle",
        disableeditsection: "true",
        disabletoc: "true"
    });

    try {
        const response = await fetch(`${WIKI_API_URL}?${params}`);
        const data = await response.json();

        if (data.parse) {
            return {
                id: data.parse.pageid.toString(),
                // FIX: Strip HTML tags from displaytitle
                title: stripHtmlTags(data.parse.displaytitle),
                content: data.parse.text["*"]
            };
        } else {
            throw new Error("Page not found");
        }
    } catch (error) {
        throw error;
    }
}

async function apiGetRandomArticle() {
    const params = new URLSearchParams({
        action: "query",
        generator: "random",
        grnnamespace: 0,
        format: "json",
        origin: "*",
        prop: "info",
        inprop: "url"
    });

    try {
        const response = await fetch(`${WIKI_API_URL}?${params}`);
        const data = await response.json();
        
        if (data.query && data.query.pages) {
            const pageId = Object.keys(data.query.pages)[0];
            const page = data.query.pages[pageId];
            // Fetch full content
            const articleData = await apiGetArticleByTitle(page.title);
            return articleData;
        }
        throw new Error("Failed to get random article");
    } catch (error) {
        throw error;
    }
}

// Local Database Mocks
let localDatabase = [];

async function apiCreateLocalArticle(id, title, content) {
    const newArticle = { id, title, content, isLocal: true };
    localDatabase.push(newArticle);
    return newArticle;
}

async function apiGetLocalArticle(id) {
    return localDatabase.find(item => item.id === id);
}