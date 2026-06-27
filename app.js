// DOM Elements
const navList = document.getElementById('historyList');
const articleTitle = document.getElementById('articleTitle');
const articleBody = document.getElementById('articleBody');
const loadingIndicator = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');
const backBtn = document.getElementById('backBtn');
const breadcrumb = document.getElementById('breadcrumb');
const editBtn = document.getElementById('editBtn');
const editorContainer = document.getElementById('editorContainer');
const editorTextarea = document.getElementById('editorTextarea');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

// State
let historyStack = []; // For Back Button (stores {id, title})
let visitedArticles = []; // For Sidebar History (stores {id, title})
let currentId = null; 
let currentTitle = "";
let isEditMode = false;
let isLocalArticle = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadArticle("Welcome"); 
    
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
    backBtn.addEventListener('click', goBack);
    editBtn.addEventListener('click', enableEditMode);
    cancelBtn.addEventListener('click', disableEditMode);
    saveBtn.addEventListener('click', saveLocalArticle);

    // Intercept Internal Wikipedia Links
    articleBody.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            const href = e.target.getAttribute('href');
            if (href && href.startsWith('/wiki/')) {
                e.preventDefault(); 
                const wikiTitle = decodeURIComponent(href.replace('/wiki/', ''));
                loadArticle(wikiTitle);
            }
        }
    });
});

async function loadArticle(identifier) {
    showLoading(true);
    disableEditMode();

    try {
        let data;
        
        // Check Local First
        const local = await apiGetLocalArticle(identifier);
        if (local) {
            data = local;
            isLocalArticle = true;
        } else if (identifier === "Welcome") {
            data = { 
                id: "welcome-local",
                title: "Welcome to WikiLite", 
                content: "<p>This is <b>WikiLite v0.0.1</b>. It now connects to the real <a href='https://www.wikipedia.org'>Wikipedia</a> API!</p><p>Try searching for 'Quantum Physics' or click Random.</p>", 
                isLocal: true 
            };
            isLocalArticle = true;
        } else {
            // Fetch from Real Wikipedia
            data = await apiGetArticleByTitle(identifier);
            isLocalArticle = false;
        }

        // Update History Stack (for Back Button)
        // Only push if we are moving to a NEW article
        if (currentId && currentId !== data.id) {
            historyStack.push({ id: currentId, title: currentTitle });
        }
        
        // Update Visited List (for Sidebar)
        addToVisited(data.title, data.id);

        // Set Current State
        currentId = data.id;
        currentTitle = data.title;
        
        updateNavUI();
        renderSidebar(); // FIX: Force sidebar re-render to update active class

        // Render Content
        articleTitle.textContent = data.title;
        articleBody.innerHTML = data.content;
        breadcrumb.textContent = isLocalArticle ? `Local / ${data.title}` : `Wikipedia / ${data.title}`;
        
        // Show Edit button only for local articles
        if (isLocalArticle) {
            editBtn.classList.remove('hidden');
        } else {
            editBtn.classList.add('hidden');
        }

    } catch (error) {
        console.error(error);
        articleTitle.textContent = "Not Found";
        articleBody.innerHTML = `<p>Could not find "${identifier}" on Wikipedia.</p><button onclick="startCreateLocal('${identifier}')">Create Local Article</button>`;
        editBtn.classList.add('hidden');
    } finally {
        showLoading(false);
    }
}

// Manage Sidebar History
function addToVisited(title, id) {
    // Remove if already exists to move it to top
    visitedArticles = visitedArticles.filter(item => item.id !== id);
    
    // Add to front
    visitedArticles.unshift({ title, id });
    
    // Keep only last 10
    if (visitedArticles.length > 10) visitedArticles.pop();
    
    // Note: We don't call renderSidebar() here because loadArticle() calls it after setting currentId
}

function renderSidebar() {
    navList.innerHTML = '';
    if (visitedArticles.length === 0) {
        navList.innerHTML = '<li style="color:#888; font-size:0.8rem;">No history yet...</li>';
        return;
    }

    visitedArticles.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = item.title;
        
        // FIX: Strict equality check for active state
        if (item.id === currentId) {
            a.classList.add('active');
        }
        
        a.onclick = () => loadArticle(item.title); 
        li.appendChild(a);
        navList.appendChild(li);
    });
}

async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    showLoading(true);
    try {
        const results = await apiSearchArticles(query);
        if (results.length > 0) {
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
        
        // Push current to history stack before changing
        if (currentId) {
            historyStack.push({ id: currentId, title: currentTitle });
        }
        
        currentId = data.id;
        currentTitle = data.title;
        isLocalArticle = false;
        
        addToVisited(data.title, data.id);
        updateNavUI();
        renderSidebar(); // FIX: Update sidebar
        
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
    
    // Set state manually before loading to ensure active class works
    currentId = prev.id;
    currentTitle = prev.title;
    
    updateNavUI();
    renderSidebar(); // FIX: Update sidebar before fetch completes
    
    loadArticle(prev.title); 
}

// Local Edit/Create Functions
function startCreateLocal(title) {
    isLocalArticle = true;
    currentId = title.toLowerCase().replace(/\s+/g, '_');
    currentTitle = title;
    enableEditMode(true);
}

function enableEditMode(isNew = false) {
    if (!isLocalArticle) return; 
    isEditMode = true;
    articleBody.classList.add('hidden');
    editorContainer.classList.remove('hidden');
    editBtn.classList.add('hidden');
    
    if (isNew) {
        editorTextarea.value = "";
        saveBtn.textContent = "Create Local Page";
    } else {
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
    const content = `<p>${editorTextarea.value.replace(/\n/g, '<br>')}</p>`; 
    showLoading(true);
    
    await apiCreateLocalArticle(currentId, currentTitle, content);
    
    disableEditMode();
    articleBody.innerHTML = content;
    articleTitle.textContent = currentTitle;
    breadcrumb.textContent = `Local / ${currentTitle}`;
    addToVisited(currentTitle, currentId);
    renderSidebar(); // FIX: Update sidebar
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