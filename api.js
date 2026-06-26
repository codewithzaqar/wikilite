/**
 * WikiLite Mock Database
 */
const mockDatabase = [
    {
        id: "html",
        title: "HTML",
        content: "<b>HyperText Markup Language (HTML)</b> is the standard markup language for documents designed to be displayed in a web browser. It defines the content and structure of web content."
    },
    {
        id: "css",
        title: "CSS",
        content: "<b>Cascading Style Sheets (CSS)</b> is a style sheet language used for describing the presentation of a document written in a markup language such as HTML. CSS is a cornerstone technology of the World Wide Web."
    },
    {
        id: "js",
        title: "JavaScript",
        content: "<b>JavaScript</b>, often abbreviated as JS, is a programming language that is one of the core technologies of the World Wide Web, alongside HTML and CSS. It enables interactive web pages."
    },
    {
        id: "api",
        title: "API",
        content: "An <b>Application Programming Interface (API)</b> is a way for two or more computer programs to communicate with each other. It is a type of software interface, offering a service to other pieces of software."
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
                resolve(article);
            } else {
                reject("Article not found");
            }
        }, 200); // Fast response
    });
}

// NEW: Get a random article
async function apiGetRandomArticle() {
    return new Promise((resolve) => {
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * mockDatabase.length);
            resolve(mockDatabase[randomIndex]);
        }, 150);
    });
}