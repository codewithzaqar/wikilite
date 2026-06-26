/**
 * WikiLite Mock Database
 * Note: Content now uses [[id]] syntax for internal links
 */
const mockDatabase = [
    {
        id: "html",
        title: "HTML",
        content: "<b>HyperText Markup Language (HTML)</b> is the standard markup language for documents designed to be displayed in a web browser. It defines the content and structure of web content. It works closely with [[css]] and [[js]]"
    },
    {
        id: "css",
        title: "CSS",
        content: "<b>Cascading Style Sheets (CSS)</b> is a style sheet language used for describing the presentation of a document written in a markup language such as [[html]]. CSS is a cornerstone technology of the World Wide Web."
    },
    {
        id: "js",
        title: "JavaScript",
        content: "<b>JavaScript</b>, often abbreviated as JS, is a programming language that is one of the core technologies of the World Wide Web, alongside [[html]] and [[css]]. It enables interactive web pages."
    },
    {
        id: "api",
        title: "API",
        content: "An <b>Application Programming Interface (API)</b> is a way for two or more computer programs to communicate with each other. In web development, APIs often return data in formats like JSON, which can be processed by [[js]]."
    }
];

async function apiGetAllArticles() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockDatabase.map(item => ({ id: item.id, title: item.title })));
        }, 300);
    });
}

async function apiGetArticleById(id) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const article = mockDatabase.find(item => item.id === id.toLowerCase());
            if (article) {
                // Return a copy to avoid modifying original DB
                resolve({...article});
            } else {
                reject("Article not found");
            }
        }, 200); // Fast response
    });
}

async function apiGetRandomArticle() {
    return new Promise((resolve) => {
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * mockDatabase.length);
            resolve(mockDatabase[randomIndex]);
        }, 150);
    });
}

// NEW: Parse internal links [[id]] into clickable HTML
function parseWikiLinks(content) {
    // Regex to find [[id]]
    return content.replace(/\[\[(.*?)\]\]/g, (match, id) => {
        // Find the title for the tooltip/display
        const linkedArticle = mockDatabase.find(a => a.id === id);
        const title = linkedArticle ? linkedArticle.title : id;

        // Return anchor tag with a special class and data-id
        return `<span class="wiki-link" data-id="${id}">${title}</span>`;
    });
}