// DOM Elements
const navList = document.getElementById('navList');
const articleTitle = document.getElementById('articleTitle');
const articleBody = document.getElementById('articleBody');
const loadingIndicator = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');
const randomBtn = document.getElementById('randomBtn');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadSidebar();

    // Add Enter key listener for search
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Add Random Button listener
    randomBtn.addEventListener('click', loadRandomArticle);
});

async function loadSidebar() {
    try {
        const articles = await apiGetAllArticles();
        navList.innerHTML = ''; // Clear current
        
        articles.forEach(article => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = article.title;
            a.dataset.id = article.id;  // Store ID for active state tracking
            a.onclick = () => loadArticle(article.id);
            li.appendChild(a);
            navList.appendChild(li);
        });
    } catch (error) {
        console.error("Failed to load sidebar:", error);
    }
}

async function loadArticle(id) {
    showLoading(true);
    try {
        const data = await apiGetArticleById(id);
        
        // Update UI
        articleTitle.textContent = data.title;
        articleBody.innerHTML = data.content;

        // Update Active State in Sidebar
        updateActiveLink(id);
    } catch (error) {
        articleTitle.textContent = "Error";
        articleBody.textContent = "Could not find the requested article.";
    } finally {
        showLoading(false);
    }
}

// NEW: Load Random Article
async function loadRandomArticle() {
    showLoading(true);
    try {
        const data = await apiGetRandomArticle();
        articleTitle.textContent = data.title;
        articleBody.innerHTML = data.content;
        updateActiveLink(data.id);
    } catch (error) {
        console.error(error);
    } finally {
        showLoading(false);
    }
}

// NEW: Highlight current link
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

    // Simple search logic against mock DB
    const found = mockDatabase.find(item => 
        item.title.toLowerCase().includes(query) || 
        item.id.includes(query)
    );

    if (found) {
        loadArticle(found.id);
        searchInput.value = ''; // Clear search
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