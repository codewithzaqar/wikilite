/**
 * WikiLite Real Wikipedia API Connector
 * v0.0.2b01
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

// UPDATED: Fetch images as well
async function apiGetArticleByTitle(title) {
    const params = new URLSearchParams({
        action: "query",
        titles: title,
        format: "json",
        origin: "*",
        prop: "info|pageimages|extracts", // Added pageimages
        pithumbsize: 400, // Thumbnail size
        exintro: true, // Only intro extract
        explaintext: true
    });

    try {
        const response = await fetch(`${WIKI_API_URL}?${params}`);
        const data = await response.json();

        if (data.query && data.query.pages) {
            const pageId = Object.keys(data.query.pages)[0];
            const page = data.query.pages[pageId];
            
            if (page.missing) {
                throw new Error("Page not found");
            }

            // Get images from pageimages if available
            let images = [];
            if (page.thumbnail) {
                images.push({
                    url: page.thumbnail.source,
                    title: page.title
                });
            }
            
            // Note: Full image gallery requires a separate API call usually, 
            // but for this version we use the main thumbnail or embedded images in HTML.
            // To keep it simple, we will rely on the main thumbnail for now.
            
            return {
                id: pageId.toString(),
                title: page.title,
                content: page.extract ? `<p>${page.extract}</p>` : "<p>No content available.</p>",
                sections: [], // Simplified for this version
                images: images
            };
        } else {
            throw new Error("Page not found");
        }
    } catch (error) {
        throw error;
    }
}

// Alternative: Get full content with parse (for ToC and internal links)
async function apiGetFullArticleByTitle(title) {
    const params = new URLSearchParams({
        action: "parse",
        page: title,
        format: "json",
        origin: "*",
        prop: "text|displaytitle|sections",
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
                sections: data.parse.sections || []
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
            // Use full article for random to get ToC
            const articleData = await apiGetFullArticleByTitle(page.title);
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