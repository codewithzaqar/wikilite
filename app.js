// DOM Elements
const navList = document.getElementById('navList');
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
const backdrop = document.getElementById('backdrop');
const imageGallery = document.getElementById('imageGallery');
const galleryGrid = document.getElementById('galleryGrid');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const captionText = document.getElementById('caption');
const closeLightbox = document.querySelector('.close-lightbox');
const suggestionsList = document.getElementById('suggestionsList'); // NEW
const searchResultsContainer = document.getElementById('searchResultsContainer'); // NEW
const searchResultsList = document.getElementById('searchResultsList'); // NEW

// State
let historyStack = []; 
let visitedArticles = []; 
let currentId = null; 
let currentTitle = "";
let isEditMode = false;
let isLocalArticle = false;
let searchTimeout; // NEW

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadArticle("Welcome"); 
    
    // Search Listeners
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
    searchInput.addEventListener('input', handleSearchInput); // NEW
    
    backBtn.addEventListener('click', goBack);
    editBtn.addEventListener('click', enableEditMode);
    cancelBtn.addEventListener('click', disableEditMode);
    saveBtn.addEventListener('click', saveLocalArticle);
    themeToggle.addEventListener('click', toggleTheme);
    menuToggle.addEventListener('click', toggleSidebar);
    backdrop.addEventListener('click', closeSidebar);
    
    closeLightbox.addEventListener('click', () => lightbox.style.display = "none");
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.style.display = "none"; });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) hideSuggestions();
    });

    // Intercept Internal Wikipedia Links
    articleBody.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            const href = e.target.getAttribute('href');
            if (href && href.startsWith('/wiki/')) {
                e.preventDefault(); 
                const wikiTitle = decodeURIComponent(href.replace('/wiki/', ''));
                loadArticle(wikiTitle);
            } else if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// NEW: Search Autocomplete Logic
function handleSearchInput(e) {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    if (query.length < 2) {
        hideSuggestions();
        return;
    }
    searchTimeout = setTimeout(() => fetchSuggestions(query), 300);
}

async function fetchSuggestions(query) {
    const suggestions = await apiGetSearchSuggestions(query);
    renderSuggestions(suggestions);
}

function renderSuggestions(suggestions) {
    suggestionsList.innerHTML = '';
    if (suggestions.length === 0) {
        hideSuggestions();
        return;
    }
    suggestions.forEach(s => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${s.title}</strong><small>${s.description}</small>`;
        li.onclick = () => {
            searchInput.value = s.title;
            hideSuggestions();
            loadArticle(s.title);
        };
        suggestionsList.appendChild(li);
    });
    suggestionsList.classList.remove('hidden');
}

function hideSuggestions() {
    suggestionsList.classList.add('hidden');
}

// Theme & Sidebar Logic (Same as before)
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
    if (themeToggle) themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}
function toggleSidebar() { document.body.classList.toggle('sidebar-open'); }
function closeSidebar() { document.body.classList.remove('sidebar-open'); }
function closeSidebarIfMobile() { if (window.innerWidth <= 768) closeSidebar(); }

// UPDATED: loadArticle now returns true/false
async function loadArticle(identifier) {
    showLoading(true);
    disableEditMode();
    clearToC();
    clearGallery();
    searchResultsContainer.classList.add('hidden'); // Hide search results if open
    articleBody.classList.remove('hidden');

    try {
        let data;
        const local = await apiGetLocalArticle(identifier);
        if (local) {
            data = local;
            isLocalArticle = true;
        } else if (identifier === "Welcome") {
            data = { 
                id: "welcome-local", title: "Welcome to WikiLite", 
                content: "<p>This is <b>WikiLite v0.0.2b02</b>. Try the new <b>Search Autocomplete</b>!</p>", 
                isLocal: true, sections: [], images: []
            };
            isLocalArticle = true;
        } else {
            data = await apiGetFullArticleByTitle(identifier);
            isLocalArticle = false;
        }

        if (currentId && currentId !== data.id) historyStack.push({ id: currentId, title: currentTitle });
        
        addToVisited(data.title, data.id);
        currentId = data.id;
        currentTitle = data.title;
        
        updateNavUI();
        renderSidebar();
        renderToC(data.sections);
        
        if (data.images && data.images.length > 0) renderGallery(data.images);

        articleTitle.textContent = data.title;
        articleBody.innerHTML = data.content;
        breadcrumb.textContent = isLocalArticle ? `Local / ${data.title}` : `Wikipedia / ${data.title}`;
        
        editBtn.classList.toggle('hidden', !isLocalArticle);
        return true; // Success

    } catch (error) {
        return false; // Failure
    } finally {
        showLoading(false);
        closeSidebarIfMobile();
    }
}

// UPDATED: handleSearch with fallback to results page
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    hideSuggestions();

    showLoading(true);
    try {
        const success = await loadArticle(query);
        if (!success) {
            // Exact match failed, show search results
            const results = await apiSearchArticles(query); /* Remember only apiSearchArticles works not apiSearchArticlesFull */
            renderSearchResults(query, results);
        }
    } catch (error) {
        console.error(error);
    } finally {
        showLoading(false);
        searchInput.value = '';
    }
}

// NEW: Render Search Results
function renderSearchResults(query, results) {
    searchResultsContainer.classList.remove('hidden');
    articleBody.classList.add('hidden');
    imageGallery.classList.add('hidden');
    clearToC();
    
    articleTitle.textContent = `Search Results for "${query}"`;
    breadcrumb.textContent = `Search / ${query}`;
    editBtn.classList.add('hidden');
    
    searchResultsList.innerHTML = '';
    if (results.length === 0) {
        searchResultsList.innerHTML = '<li class="search-result-item">No results found.</li>';
        return;
    }
    
    results.forEach(res => {
        const li = document.createElement('li');
        li.className = 'search-result-item';
        li.innerHTML = `
            <h3 class="result-title">${res.title}</h3>
            <p class="result-snippet">${res.snippet}...</p>
        `;
        li.onclick = () => {
            searchResultsContainer.classList.add('hidden');
            articleBody.classList.remove('hidden');
            loadArticle(res.title);
        };
        searchResultsList.appendChild(li);
    });
}

// Gallery, ToC, Sidebar, and Edit functions remain the same as v0.0.2b01...
function renderGallery(images) {
    galleryGrid.innerHTML = '';
    imageGallery.classList.remove('hidden');
    images.forEach(img => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        const imageEl = document.createElement('img');
        imageEl.src = img.url;
        imageEl.alt = img.title;
        imageEl.loading = "lazy";
        div.appendChild(imageEl);
        div.onclick = () => openLightbox(img.url, img.title);
        galleryGrid.appendChild(div);
    });
}
function clearGallery() { galleryGrid.innerHTML = ''; imageGallery.classList.add('hidden'); }
function openLightbox(url, caption) {
    lightbox.style.display = "flex";
    lightboxImg.src = url;
    captionText.innerHTML = caption;
}
function renderToC(sections) {
    tocList.innerHTML = '';
    if (!sections || sections.length === 0) { tocHeader.classList.add('hidden'); return; }
    tocHeader.classList.remove('hidden');
    const relevantSections = sections.filter(s => s.level > 0);
    relevantSections.forEach(section => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = section.line;
        a.onclick = (e) => {
            e.preventDefault();
            const target = document.getElementById(section.anchor);
            if (target) { target.scrollIntoView({ behavior: 'smooth' }); closeSidebarIfMobile(); }
        };
        if (section.level > 1) { a.style.paddingLeft = (10 + (section.level * 5)) + 'px'; a.style.fontSize = '0.8rem'; }
        li.appendChild(a);
        tocList.appendChild(li);
    });
}
function clearToC() { tocList.innerHTML = ''; tocHeader.classList.add('hidden'); }
function addToVisited(title, id) {
    visitedArticles = visitedArticles.filter(item => item.id !== id);
    visitedArticles.unshift({ title, id });
    if (visitedArticles.length > 10) visitedArticles.pop();
}
function renderSidebar() {
    historyList.innerHTML = '';
    if (visitedArticles.length === 0) { historyList.innerHTML = '<li style="color:#888; font-size:0.8rem;">No history yet...</li>'; return; }
    visitedArticles.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = item.title;
        if (item.id === currentId) a.classList.add('active');
        a.onclick = () => loadArticle(item.title); 
        li.appendChild(a);
        historyList.appendChild(li);
    });
}
async function loadRandomArticle() {
    showLoading(true);
    try {
        const data = await apiGetRandomArticle();
        if (currentId) historyStack.push({ id: currentId, title: currentTitle });
        currentId = data.id; currentTitle = data.title; isLocalArticle = false;
        addToVisited(data.title, data.id); updateNavUI(); renderSidebar();
        articleTitle.textContent = data.title; articleBody.innerHTML = data.content;
        breadcrumb.textContent = `Wikipedia / ${data.title}`; editBtn.classList.add('hidden');
    } catch (error) { alert("Failed to load random article"); } finally { showLoading(false); closeSidebarIfMobile(); }
}
function goBack() {
    if (historyStack.length === 0) return;
    const prev = historyStack.pop(); currentId = prev.id; currentTitle = prev.title;
    updateNavUI(); renderSidebar(); loadArticle(prev.title); 
}
function startCreateLocal(title) {
    isLocalArticle = true; currentId = title.toLowerCase().replace(/\s+/g, '_'); currentTitle = title; enableEditMode(true);
}
function enableEditMode(isNew = false) {
    if (!isLocalArticle) return; isEditMode = true;
    articleBody.classList.add('hidden'); editorContainer.classList.remove('hidden'); editBtn.classList.add('hidden'); clearToC(); clearGallery();
    if (isNew) { editorTextarea.value = ""; saveBtn.textContent = "Create Local Page"; } 
    else { editorTextarea.value = articleBody.innerText; saveBtn.textContent = "Save Local Changes"; }
}
function disableEditMode() {
    isEditMode = false; articleBody.classList.remove('hidden'); editorContainer.classList.add('hidden'); if (isLocalArticle) editBtn.classList.remove('hidden');
}
async function saveLocalArticle() {
    const content = `<p>${editorTextarea.value.replace(/\n/g, '<br>')}</p>`; showLoading(true);
    await apiCreateLocalArticle(currentId, currentTitle, content);
    disableEditMode(); articleBody.innerHTML = content; articleTitle.textContent = currentTitle;
    breadcrumb.textContent = `Local / ${currentTitle}`; addToVisited(currentTitle, currentId); renderSidebar(); showLoading(false);
}
function updateNavUI() { backBtn.disabled = historyStack.length === 0; }
function showLoading(isLoading) {
    if (isLoading) { loadingIndicator.classList.remove('hidden'); articleBody.style.opacity = '0.5'; } 
    else { loadingIndicator.classList.add('hidden'); articleBody.style.opacity = '1'; }
}