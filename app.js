// DOM Elements
const navList = document.getElementById('navList'); // Reused for Main links
const historyList = document.getElementById('historyList');
const tocList = document.getElementById('tocList');
const tocHeader = document.getElementById('tocHeader');
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
const themeToggle = document.getElementById('themeToggle');
const menuToggle = document.getElementById('menuToggle');
const backdrop = document.getElementById('backdrop')

// State
let historyStack = []; 
let visitedArticles = []; 
let currentId = null; 
let currentTitle = "";
let isEditMode = false;
let isLocalArticle = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadArticle("Welcome"); 
    
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
    backBtn.addEventListener('click', goBack);
    editBtn.addEventListener('click', enableEditMode);
    cancelBtn.addEventListener('click', disableEditMode);
    saveBtn.addEventListener('click', saveLocalArticle);
    themeToggle.addEventListener('click', toggleTheme);

    // NEW: Mobile Menu Listeners
    menuToggle.addEventListener('click', toggleSidebar);
    backdrop.addEventListener('click', closeSidebar);

    // Intercept Internal Wikipedia Links
    articleBody.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            const href = e.target.getAttribute('href');
            if (href && href.startsWith('/wiki/')) {
                e.preventDefault();     const wikiTitle = decodeURIComponent(href.replace('/wiki/', ''));
                loadArticle(wikiTitle);
            } else if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    });
});

// NEW: Sidebar Toggle Logic
function toggleSidebar() {
    document.body.classList.toggle('sidebar-open');
}

function closeSidebar() {
    document.body.classList.remove('sidebar-open');
}

// Helper to close sidebar on mobile after navigation
function closeSidebarIfMobile() {
    if (window.innerHTML <= 768) {
        closeSidebar();
    }
}

// Theme Logic
function initTheme() {
    const savedTheme = localStorage.getItem('wikilite_theme') || 'light';
    applyTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('wikilite_theme', newTheme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
    if (themeToggle) themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';}

async function loadArticle(identifier) {
    showLoading(true);
    disableEditMode();
    clearToC(); // Clear previous ToC

    try {
        let data;
        
        const local = await apiGetLocalArticle(identifier);
        if (local) {
            data = local;
            isLocalArticle = true;
        } else if (identifier === "Welcome") {
            data = { 
                id: "welcome-local",
                title: "Welcome to WikiLite", 
                content: "<p>This is <b>WikiLite v0.0.2a02</b>. It now has a <b>Table of Contents</b>!</p>", 
                isLocal: true,
                sections: []
            };
            isLocalArticle = true;
        } else {
            data = await apiGetArticleByTitle(identifier);
            isLocalArticle = false;
        }

        if (currentId && currentId !== data.id) {
            historyStack.push({ id: currentId, title: currentTitle });
        }
        
        addToVisited(data.title, data.id);
        currentId = data.id;
        currentTitle = data.title;
        
        updateNavUI();
        renderSidebar();
        renderToC(data.sections); // NEW: Render ToC

        articleTitle.textContent = data.title;
        articleBody.innerHTML = data.content;
        breadcrumb.textContent = isLocalArticle ? `Local / ${data.title}` : `Wikipedia / ${data.title}`;
        
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
        closeSidebarIfMobile()
    }
}

function renderToC(sections) {
    tocList.innerHTML = '';
    
    if (!sections || sections.length === 0) {
        tocHeader.classList.add('hidden');
        return;
    }

    tocHeader.classList.remove('hidden');
    const relevantSections = sections.filter(s => s.level > 0);

    relevantSections.forEach(section => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = section.line; // Section title
        const anchor = section.anchor;
        
        a.onclick = (e) => {
            e.preventDefault();
            const target = document.getElementById(anchor);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                closeSidebarIfMobile();
            }
        };

        if (section.level > 1) {
            a.style.paddingLeft = (10 + (section.level * 5)) + 'px';
            a.style.fontSize = '0.8rem';
        }

        li.appendChild(a);
        tocList.appendChild(li);
    });
}

function clearToC() {
    tocList.innerHTML = '';
    tocHeader.classList.add('hidden');}

function addToVisited(title, id) {
    visitedArticles = visitedArticles.filter(item => item.id !== id);
    visitedArticles.unshift({ title, id });
    if (visitedArticles.length > 10) visitedArticles.pop();
}

function renderSidebar() {
    historyList.innerHTML = '';
    if (visitedArticles.length === 0) {
        historyList.innerHTML = '<li style="color:#888; font-size:0.8rem;">No history yet...</li>';
        return;
    }

    visitedArticles.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = item.title;
        
        if (item.id === currentId) {
            a.classList.add('active');
        }
        
        a.onclick = () => loadArticle(item.title); 
        li.appendChild(a);
        historyList.appendChild(li);
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
        if (currentId) historyStack.push({ id: currentId, title: currentTitle });
        
        currentId = data.id;
        currentTitle = data.title;
        isLocalArticle = false;
        
        addToVisited(data.title, data.id);
        updateNavUI();
        renderSidebar();
        
        articleTitle.textContent = data.title;
        articleBody.innerHTML = data.content;
        breadcrumb.textContent = `Wikipedia / ${data.title}`;
        editBtn.classList.add('hidden');
    } catch (error) {
        alert("Failed to load random article");
    } finally {
        showLoading(false);
        closeSidebarIfMobile();
    }
}

function goBack() {
    if (historyStack.length === 0) return;
    
    const prev = historyStack.pop();
    currentId = prev.id;
    currentTitle = prev.title;
    
    updateNavUI();
    renderSidebar();
    
    loadArticle(prev.title); 
}

function startCreateLocal(title) {
    isLocalArticle = true;
    currentId = title.toLowerCase().replace(/\s+/g, '_');
    currentTitle = title;
    enableEditMode(true);
}

function enableEditMode(isNew = false) {
    if (!isLocalArticle) return; 
    isEditMode = true;  articleBody.classList.add('hidden');
    editorContainer.classList.remove('hidden');
    editBtn.classList.add('hidden');
    clearToC(); // Hide ToC in edit mode
    
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
    renderSidebar();
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