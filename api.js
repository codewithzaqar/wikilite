/**
 * WikiLite Real Wikipedia API Connector
 * v0.0.2a02
 */

const WIKI_API_URL = "https://en.wikipedia.org/w/api.php";

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
                title: item.title
            }));
        }
        return [];
    } catch (error) {
        console.error("API Search Error:", error);
        return [];
    }
}

// UPDATED: Fetch sections as well
async function apiGetArticleByTitle(title) {
    const params = new URLSearchParams({
        action: "parse",
        page: title,
        format: "json",
        origin: "*",
        prop: "text|displaytitle|sections", // Added sections
        disableeditsection: "true",
        disabletoc: "true"
    });

    try {
        const response = await fetch(`${WIKI_API_URL}?${params}`);
        const data = await response.json();

        if (data.parse) {
            return {
                id: data.parse.pageid.toString(),
                title: stripHtmlTags(data.parse.displaytitle),
                content: data.parse.text["*"],
                sections: data.parse.sections || [] // Return sections array
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
            const articleData = await apiGetArticleByTitle(page.title);
            return articleData;
        }
        throw new Error("Failed to get random article");
    } catch (error) {
        throw error;
    }
}

// Local Database with LocalStorage Persistence
function getLocalArticles() {
    const stored = localStorage.getItem('wikilite_local_articles');
    return stored ? JSON.parse(stored) : [];
}

function saveLocalArticles(articles) {
    localStorage.setItem('wikilite_local_articles', JSON.stringify(articles));
}

async function apiCreateLocalArticle(id, title, content) {
    let articles = getLocalArticles();
    const existingIndex = articles.findIndex(a => a.id === id);
    const newArticle = { id, title, content, isLocal: true };
    
    if (existingIndex !== -1) {
        articles[existingIndex] = newArticle;
    } else {
        articles.push(newArticle);
    }
    
    saveLocalArticles(articles);
    return newArticle;
}

async function apiGetLocalArticle(id) {
    const articles = getLocalArticles();
    return articles.find(item => item.id === id);
}