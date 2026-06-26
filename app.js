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

// State Management
let historyStack = [];
let currentId = null;
let isEditMode = false;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadSidebar();
    
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
    randomBtn.addEventListener('click', loadRandomArticle);
    backBtn.addEventListener('click', goBack);
    
    // Edit Mode Listeners
    editBtn.addEventListener('click', enableEditMode);
    cancelBtn.addEventListener('click', disableEditMode);
    saveBtn.addEventListener('click', saveArticle);

    // Event Delegation for Internal Links
    articleBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('wiki-link')) {
            const id = e.target.dataset.id;
            // If it's a red link, prompt to create
            if (e.target.classList.contains('red-link')) {
                const confirmCreate = confirm(`Article "${id}" does not exist. Would you like to create it?`);
                if (confirmCreate) {
                    startCreateArticle(id);
                }
            } else {
                loadArticle(id);
            }
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
    } catch (error) { console.error("Sidebar error:", error); }
}

async function loadArticle(id) {
    if (currentId === id && !isEditMode && historyStack.length > 0) return;

    showLoading(true);
    disableEditMode(); // Ensure we are in view mode

    try {
        const data = await apiGetArticleById(id);
        
        if (currentId) historyStack.push(currentId);
        currentId = id;
        updateNavUI();

        const parsedContent = parseWikiLinks(data.content);

        articleTitle.textContent = data.title;
        articleBody.innerHTML = parsedContent;
        breadcrumb.textContent = `Wiki / ${data.title}`;
        
        editBtn.classList.remove('hidden'); // Show edit button
        updateActiveLink(id);
    } catch (error) {
        // This block might be hit if direct ID load fails, but usually handled by red links
        articleTitle.textContent = "Error";
        articleBody.textContent = "Could not find the requested article.";
        editBtn.classList.add('hidden');
    } finally {
        showLoading(false);
    }
}

// NEW: Start Create Process
function startCreateArticle(id) {
    currentId = id.toLowerCase();
    if (historyStack.length === 0 || historyStack[historyStack.length-1] !== currentId) {
         // Don't push if we are already creating this one
    }
    
    articleTitle.textContent = `Create: ${currentId}`;
    breadcrumb.textContent = `Wiki / Create New`;
    editBtn.classList.add('hidden');
    
    enableEditMode(true); // true = isNew
}

// NEW: Enable Edit Mode
function enableEditMode(isNew = false) {
    isEditMode = true;
    articleBody.classList.add('hidden');
    editorContainer.classList.remove('hidden');
    
    if (isNew) {
        editorTextarea.value = "";
        saveBtn.textContent = "Create Page";
    } else {
        // Get raw content from DB (simplified for mock)
        // In a real app, we'd store raw markdown separately from HTML
        // Here we just strip tags for demo or use a stored raw version. 
        // For this mock, let's just put a placeholder or try to reverse parse (hard).
        // To keep it simple: we will just let them overwrite.
        editorTextarea.value = "Edit content here... (Use [[id]] for links)";
        saveBtn.textContent = "Save Page";
    }
}

function disableEditMode() {
    isEditMode = false;
    articleBody.classList.remove('hidden');
    editorContainer.classList.add('hidden');
}

// NEW: Save Article
async function saveArticle() {
    const content = editorTextarea.value;
    if (!content.trim()) {
        alert("Content cannot be empty");
        return;
    }

    showLoading(true);
    try {
        // Check if article exists in DB to decide Create vs Update
        const exists = mockDatabase.find(i => i.id === currentId);
        
        let savedData;
        if (exists) {
            savedData = await apiUpdateArticle(currentId, content);
        } else {
            // Generate Title from ID for simplicity
            const title = currentId.charAt(0).toUpperCase() + currentId.slice(1);
            savedData = await apiCreateArticle(currentId, title, content);
        }

        // Reload sidebar to show new article
        await loadSidebar();
        
        // Render the new/updated article
        const parsedContent = parseWikiLinks(savedData.content);
        articleTitle.textContent = savedData.title;
        articleBody.innerHTML = parsedContent;
        breadcrumb.textContent = `Wiki / ${savedData.title}`;
        
        disableEditMode();
        editBtn.classList.remove('hidden');
        updateActiveLink(currentId);
        
    } catch (error) {
        alert("Failed to save: " + error);
    } finally {
        showLoading(false);
    }
}

async function loadRandomArticle() {
    showLoading(true);
    disableEditMode();
    try {
        const data = await apiGetRandomArticle();
        if (currentId) historyStack.push(currentId);
        currentId = data.id;
        updateNavUI();
        const parsedContent = parseWikiLinks(data.content);
        articleTitle.textContent = data.title;
        articleBody.innerHTML = parsedContent;
        breadcrumb.textContent = `Wiki / ${data.title}`;
        editBtn.classList.remove('hidden');
        updateActiveLink(data.id);
    } catch (error) { console.error(error); } finally { showLoading(false); }
}

function goBack() {
    if (historyStack.length === 0) return;
    const previousId = historyStack.pop();
    currentId = previousId;
    updateNavUI();
    showLoading(true);
    disableEditMode();
    
    apiGetArticleById(previousId).then(data => {
        const parsedContent = parseWikiLinks(data.content);
        articleTitle.textContent = data.title;
        articleBody.innerHTML = parsedContent;
        breadcrumb.textContent = `Wiki / ${data.title}`;
        editBtn.classList.remove('hidden');
        updateActiveLink(previousId);
    }).finally(() => showLoading(false));
}

function updateNavUI() {
    backBtn.disabled = historyStack.length === 0;
}

function updateActiveLink(id) {
    const links = navList.querySelectorAll('a');
    links.forEach(link => {
        if (link.dataset.id === id) link.classList.add('active');
        else link.classList.remove('active');
    });
}

function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) return;
    const found = mockDatabase.find(item => item.title.toLowerCase().includes(query) || item.id.includes(query));
    if (found) {
        loadArticle(found.id);
        searchInput.value = ''; 
    } else {
        const confirmCreate = confirm(`No results for "${query}". Create new article?`);
        if (confirmCreate) startCreateArticle(query);
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