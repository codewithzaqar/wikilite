/**
 * WikiLite Real Wikipedia API Connector
 * v0.0.2b03
 */

const WIKI_API_URL = "https://en.wikipedia.org/w/api.php";

function stripHtmlTags(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

function extractImagesFromHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const imgs = doc.querySelectorAll('img');
    const images = [];
    const seenUrls = new Set();
    
    imgs.forEach(img => {
        const width = parseInt(img.getAttribute('width') || '0');
        const height = parseInt(img.getAttribute('height') || '0');
        if (width > 0 && width < 80) return;
        if (height > 0 && height < 80) return;
        
        let src = img.getAttribute('src');
        if (!src) return;
        if (src.startsWith('//')) src = 'https:' + src;
        if (seenUrls.has(src) || src.includes('icon') || src.includes('logo')) return;
        seenUrls.add(src);
        
        const alt = img.getAttribute('alt') || 'Image';
        images.push({ url: src, title: alt });
    });
    return images;
}

async function apiGetSearchSuggestions(query) {
    const params = new URLSearchParams({
        action: "opensearch",
        search: query,
        limit: 6,
        namespace: 0,
        format: "json",
        origin: "*"
    });
    try {
        const response = await fetch(`${WIKI_API_URL}?${params}`);
        const data = await response.json();
        if (data && data[1]) {
            return data[1].map((title, index) => ({
                title: title,
                description: data[2][index] || ''
            }));
        }
        return [];
    } catch (error) {
        return [];
    }
}

// NEW: Spell Check / Did You Mean
async function apiGetSpellCheck(query) {
    const params = new URLSearchParams({
        action: "opensearch",
        search: query,
        limit: 1,
        namespace: 0,
        format: "json",
        origin: "*"
    });
    // Opensearch usually returns the best match first, which acts as a spell check
    try {
        const response = await fetch(`${WIKI_API_URL}?${params}`);
        const data = await response.json();
        if (data && data[1] && data[1].length > 0) {
            // If the first result is different from query, it's a suggestion
            if (data[1][0].toLowerCase() !== query.toLowerCase()) {
                return data[1][0];
            }
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function apiSearchArticlesFull(query) {
    const params = new URLSearchParams({
        action: "query",
        list: "search",
        srsearch: query,
        srlimit: 10,
        format: "json",
        origin: "*"
    });
    try {
        const response = await fetch(`${WIKI_API_URL}?${params}`);
        const data = await response.json();
        if (data.query && data.query.search) {
            return data.query.search.map(item => ({
                title: item.title,
                snippet: item.snippet, 
                pageid: item.pageid.toString()
            }));
        }
        return [];
    } catch (error) {
        return [];
    }
}

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
            const htmlContent = data.parse.text["*"];
            return {
                id: data.parse.pageid.toString(),
                title: stripHtmlTags(data.parse.displaytitle),
                content: htmlContent,
                sections: data.parse.sections || [],
                images: extractImagesFromHtml(htmlContent)
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
            return await apiGetFullArticleByTitle(page.title);
        }
        throw new Error("Failed to get random article");
    } catch (error) {
        throw error;
    }
}

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
    const newArticle = { id, title, content, isLocal: true, images: [] };
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