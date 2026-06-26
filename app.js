// DOM Elements
const navList = document.getElementById('navList');
const articleTitle = document.getElementById('articleTitle');
const articleBody = document.getElementById('articleBody');
const loadingIndicator = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');
const randomBtn = document.getElementById('randomBtn');
const backBtn = document.getElementById('backBtn');
const breadcrumb = document.getElementById('breadcrumb');

// State Management
let historyStack = []; // Stores IDs of visited articles
let currentId = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadSidebar();
    
    // Search Enter key
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') handleSearch();
    });

    // Random Button
    randomBtn.addEventListener('click', loadRandomArticle);

    // Back Button
    backBtn.addEventListener('click', goBack);

    // Event Delegation for Internal Links
    articleBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('wiki-link')) {
            const id = e.target.dataset.id;
            loadArticle(id);
        }
    });
});

async function loadSidebar() {
    try {
        const articles = await apiGetAllArticles();
        navList.innerHTML = ''; 
        
        articles.forEach(article => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = article.title;
            a.dataset.id = article.id;
            a.onclick = () => loadArticle(article.id);
            li.appendChild(a);
            navList.appendChild(li);
        });
    } catch (error) {
        console.error("Failed to load sidebar:", error);
    }
}

async function loadArticle(id) {
    // Prevent reloading same article
    if (currentId === id && historyStack.length > 0) return;

    showLoading(true);
    try {
        const data = await apiGetArticleById(id);
        
        // Update History
        if (currentId) {
            historyStack.push(currentId);
        }
        currentId = id;
        updateNavUI();

        // Parse Content for Internal Links
        const parsedContent = parseWikiLinks(data.content);

        // Update UI
        articleTitle.textContent = data.title;
        articleBody.innerHTML = parsedContent;
        breadcrumb.textContent = `Wiki / ${data.title}`;
        
        updateActiveLink(id);
    } catch (error) {
        articleTitle.textContent = "Error";
        articleBody.textContent = "Could not find the requested article.";
    } finally {
        showLoading(false);
    }
}

async function loadRandomArticle() {
    showLoading(true);
    try {
        const data = await apiGetRandomArticle();
        
        if (currentId) historyStack.push(currentId);
        currentId = data.id;
        updateNavUI();

        const parsedContent = parseWikiLinks(data.content);
        articleTitle.textContent = data.title;
        articleBody.innerHTML = parsedContent;
        breadcrumb.textContent = `Wiki / ${data.title}`;
        updateActiveLink(data.id);
    } catch (error) {
        console.error(error);
    } finally {
        showLoading(false);
    }
}

// NEW: Go Back Logic
function goBack() {
    if (historyStack.length === 0) return;
    
    const previousId = historyStack.pop();
    currentId = previousId; // Set current without pushing to stack again
    updateNavUI();
    
    // Load the article directly without adding to history again
    // We need to fetch it again to render
    showLoading(true);
    apiGetArticleById(previousId).then(data => {
        const parsedContent = parseWikiLinks(data.content);
        articleTitle.textContent = data.title;
        articleBody.innerHTML = parsedContent;
        breadcrumb.textContent = `Wiki / ${data.title}`;
        updateActiveLink(previousId);
    }).finally(() => showLoading(false));
}

function updateNavUI() {
    backBtn.disabled = historyStack.length === 0;
}

function updateActiveLink(id) {
    const links = navList.querySelectorAll('a');
    links.forEach(link => {
        if (link.dataset.id === id) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) return;

    const found = mockDatabase.find(item => 
        item.title.toLowerCase().includes(query) || 
        item.id.includes(query)
    );

    if (found) {
        loadArticle(found.id);
        searchInput.value = ''; 
    } else {
        alert("No results found for: " + searchInput.value);
    }
}

function showLoading(isLoading) {
    if (isLoading) {
        loadingIndicator.classList.remove('hidden');
        articleBody.style.opacity = '0.5';
    } else {
        loadingIndicator.classList.add('hidden');
        articleBody.style.opacity = '1';
    }
}