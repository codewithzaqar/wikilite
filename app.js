// DOM Elements
const navList = document.getElementById('navList');
const articleTitle = document.getElementById('articleTitle');
const articleBody = document.getElementById('articleBody');
const loadingIndicator = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');
const randomBtn = document.getElementById('randomBtn');
const backBtn = document.getElementById('backBtn');
const breadcrumb = document.getElementById('breadcrumb');
const editBtn = document.getElementById('editBtn');
const editorContainer = document.getElementById('editorContainer');
const editorTextarea = document.getElementById('editorTextarea');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

// State
let historyStack = [];
let currentId = null; // Can be PageID (real) or slug (local)
let currentTitle = "";
let isEditMode = false;
let isLocalArticle = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load initial welcome message or random
    loadArticle("Welcome"); // Special case handled below
    
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
    randomBtn.addEventListener('click', loadRandomArticle);
    backBtn.addEventListener('click', goBack);
    editBtn.addEventListener('click', enableEditMode);
    cancelBtn.addEventListener('click', disableEditMode);
    saveBtn.addEventListener('click', saveLocalArticle);

    // Handle internal links within fetched content
    articleBody.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' && e.target.href.includes('wikipedia.org')) {
            e.preventDefault();
            const title = decodeURIComponent(e.target.href.split('/').pop());
            loadArticle(title);
        }
    });
});

async function loadArticle(identifier) {
    showLoading(true);
    disableEditMode();

    try {
        let data;
        
        const local = await apiGetLocalArticle(identifier);
        if (local) {
            data = local;
            isLocalArticle = true;
        } else if (identifier === "Welcome") {
            data = { title: "Welcome to WikiLite", content: "<p>This is <b>WikiLite v0.0.1a05b</b>. It now connects to the real <a href='https://www.wikipedia.org'>Wikipedia</a> API!</p>", isLocal: true };
            isLocalArticle = true;
        } else {
            data = await apiGetArticleByTitle(identifier);
            isLocalArticle = false;
        }

        if (currentId && currentId !== data.id) {
            historyStack.push({ id: currentId, title: currentTitle });
        }
        currentId = data.id;
        currentTitle = data.title;
        updateNavUI();

        // FIX: Use textContent for title to prevent any residual HTML injection
        articleTitle.textContent = data.title;
        
        // Use innerHTML for content because it contains formatted Wikipedia HTML
        articleBody.innerHTML = data.content;
        
        breadcrumb.textContent = isLocalArticle ? `Local / ${data.title}` : `Wikipedia / ${data.title}`;
        
        if (isLocalArticle) {
            editBtn.classList.remove('hidden');
        } else {
            editBtn.classList.add('hidden');
        }

    } catch (error) {
        articleTitle.textContent = "Not Found";
        articleBody.innerHTML = `<p>Could not find "${identifier}" on Wikipedia.</p><button onclick="startCreateLocal('${identifier}')">Create Local Article</button>`;
        editBtn.classList.add('hidden');
    } finally {
        showLoading(false);
    }
}

async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    showLoading(true);
    try {
        const results = await apiSearchArticles(query);
        if (results.length > 0) {
            // Load the top result
            loadArticle(results[0].title);
        } else {
            articleTitle.textContent = "No Results";
            articleBody.innerHTML = `<p>No Wikipedia articles found for "${query}".</p>`;
        }
    } catch (error) {
        console.error(error);
    } finally {
        showLoading(false);
        searchInput.value = '';
    }
}

async function loadRandomArticle() {
    showLoading(true);
    try {
        const data = await apiGetRandomArticle();
        if (currentId) historyStack.push({ id: currentId, title: currentTitle });
        currentId = data.id;
        currentTitle = data.title;
        isLocalArticle = false;
        updateNavUI();
        
        articleTitle.textContent = data.title;
        articleBody.innerHTML = data.content;
        breadcrumb.textContent = `Wikipedia / ${data.title}`;
        editBtn.classList.add('hidden');
    } catch (error) {
        alert("Failed to load random article");
    } finally {
        showLoading(false);
    }
}

function goBack() {
    if (historyStack.length === 0) return;
    const prev = historyStack.pop();
    currentId = prev.id;
    currentTitle = prev.title;
    updateNavUI();
    loadArticle(prev.title); // Reload
}

// Local Edit/Create Functions
function startCreateLocal(title) {
    isLocalArticle = true;
    currentId = title.toLowerCase().replace(/\s+/g, '_');
    currentTitle = title;
    enableEditMode(true);
}

function enableEditMode(isNew = false) {
    if (!isLocalArticle) return; // Safety check
    isEditMode = true;
    articleBody.classList.add('hidden');
    editorContainer.classList.remove('hidden');
    editBtn.classList.add('hidden');
    
    if (isNew) {
        editorTextarea.value = "";
        saveBtn.textContent = "Create Local Page";
    } else {
        // Strip HTML tags for editing (simple version)
        editorTextarea.value = articleBody.innerText; 
        saveBtn.textContent = "Save Local Changes";
    }
}

function disableEditMode() {
    isEditMode = false;
    articleBody.classList.remove('hidden');
    editorContainer.classList.add('hidden');
    if (isLocalArticle) editBtn.classList.remove('hidden');
}

async function saveLocalArticle() {
    const content = `<p>${editorTextarea.value.replace(/\n/g, '<br>')}</p>`; // Simple formatting
    showLoading(true);
    
    await apiCreateLocalArticle(currentId, currentTitle, content);
    
    disableEditMode();
    articleBody.innerHTML = content;
    articleTitle.textContent = currentTitle;
    breadcrumb.textContent = `Local / ${currentTitle}`;
    showLoading(false);
}

function updateNavUI() {
    backBtn.disabled = historyStack.length === 0;
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