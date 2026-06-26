// DOM Elements
const navList = document.getElementById('navList');
const articleTitle = document.getElementById('articleTitle');
const articleBody = document.getElementById('articleBody');
const loadingIndicator = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadSidebar();
});

/**
 * Loads the sidebar links using the API
 */
async function loadSidebar() {
    try {
        const articles = await apiGetAllArticles();
        navList.innerHTML = ''; // Clear current
        
        articles.forEach(article => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = article.title;
            a.onclick = () => loadArticle(article.id);
            li.appendChild(a);
            navList.appendChild(li);
        });
    } catch (error) {
        console.error("Failed to load sidebar:", error);
    }
}

/**
 * Loads specific article content
 * @param {string} id 
 */
async function loadArticle(id) {
    showLoading(true);
    try {
        const data = await apiGetArticleById(id);
        
        // Update UI
        articleTitle.textContent = data.title;
        articleBody.innerHTML = data.content;
    } catch (error) {
        articleTitle.textContent = "Error";
        articleBody.textContent = "Could not find the requested article.";
    } finally {
        showLoading(false);
    }
}

/**
 * Handles Search Functionality
 */
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

// Helper to toggle loading state
function showLoading(isLoading) {
    if (isLoading) {
        loadingIndicator.classList.remove('hidden');
        articleBody.style.opacity = '0.5';
    } else {
        loadingIndicator.classList.add('hidden');
        articleBody.style.opacity = '1';
    }
}