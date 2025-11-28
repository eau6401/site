    // --- Global Variables (Declared with 'let' to be assigned after fetch) ---
    let settingsToggle, settingsMenu, settingsItems, menuToggle;

    let currentTheme = localStorage.getItem('theme') || 'auto';
    let body = document.body;
let sidebar = document.getElementById('sidebar');
// --- Synchronous Initial Theme Check (Fix 1: Prevents FOUC/Shimmer) ---
(function() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (currentTheme === 'dark' || (currentTheme === 'auto' && prefersDark)) {
        // Apply class directly to body before script continues
        document.body.classList.add('dark-theme');
    }
})();

    // --- Utility: Debounce ---
    function debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }
    
    // --- Sidebar Persistence Check (Immediate) ---
function applyInitialSidebarState() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return; 

    // Only apply the persistent state on desktop (> 800px)
    if (window.innerWidth > 800) {
        const state = localStorage.getItem('sidebarState');
        if (state === 'hidden') {
            // This forces the 'hidden' class to be applied instantly.
            sidebar.classList.add('hidden');
        } else {
            sidebar.classList.remove('hidden');
        }
    }
}

    // --- Theme Management ---
    function applyTheme(theme) {
        // Uses settingsItems which is set in setupThemeLogic
        settingsItems.forEach(i => i.classList.toggle('active', i.dataset.theme === theme));
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        body.classList.toggle('dark-theme', theme === 'dark' || (theme === 'auto' && prefersDark));
        localStorage.setItem('theme', theme);
    }
    
    function setupThemeLogic() {
        // Assign elements after top bar injection
        settingsToggle = document.getElementById('settings-toggle');
        settingsMenu = document.getElementById('settings-menu');
        settingsItems = document.querySelectorAll('.settings-item');
        
        applyTheme(currentTheme);
    
        // Toggle settings menu
        settingsToggle.onclick = e => {
            e.stopPropagation();
            settingsMenu.classList.toggle('visible');
        };
        
        // Theme selection
        settingsItems.forEach(item => {
            item.onclick = () => {
                applyTheme(item.dataset.theme);
                settingsMenu.classList.remove('visible');
            };
        });
        
        // Close settings when clicking outside
        document.addEventListener('click', e => {
            if (!settingsMenu.contains(e.target) && !settingsToggle.contains(e.target)) {
                settingsMenu.classList.remove('visible');
            }
        });
        
        // Update theme on system preference change
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (localStorage.getItem('theme') === 'auto') {
                body.classList.toggle('dark-theme', e.matches);
            }
        });
    }

    // --- Sidebar Logic ---
    function isMobile() { return window.innerWidth <= 800; }

    function initializeSidebar() {
        if (!isMobile()) {
            sidebar.classList.remove('visible');
            const state = localStorage.getItem('sidebarState');
            if (state === 'hidden') sidebar.classList.add('hidden');
            else sidebar.classList.remove('hidden');
        } else {
            sidebar.classList.remove('hidden'); 
        }
    }
    
    function toggleSidebar() {
        if (isMobile()) {
            sidebar.classList.toggle('visible');
        } else {
            sidebar.classList.toggle('hidden');
            localStorage.setItem('sidebarState', sidebar.classList.contains('hidden') ? 'hidden' : 'visible');
        }
    }

    function setupSidebarLogic() {
        // Assign elements after top bar injection
        menuToggle = document.getElementById('menu-toggle');

        menuToggle.addEventListener('click', e => {
            e.stopPropagation();
            toggleSidebar();
        });
        
        // Close mobile sidebar on outside click
        document.addEventListener('click', e => {
            if (window.innerWidth <= 800 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('visible');
            }
        });
    }
    
    function setActiveSidebarItem() {
        const current = window.location.pathname.split('/').pop().split('?')[0].split('#')[0];
        
        // Treat an empty string current page as 'index.html' for matching purposes
        const cleanCurrent = current === '' ? 'index.html' : current;
        
        document.querySelectorAll('#sidebar a').forEach(link => {
            // General logic only: highlight the link if its href matches the current page name
            link.classList.toggle('active', link.getAttribute('href') === cleanCurrent);
        });
    }
    
 // --- Sidebar Collapsible Logic (Modified for Nested UL Structure) ---
function setupSidebarCollapsibles() {
    // 1. Process only the prominent items that contain a collapsible list
    document.querySelectorAll('#sidebar .prominent').forEach(prominentLi => {
        
        const btn = prominentLi.querySelector('button');
        const collapsibleUl = prominentLi.querySelector('ul.collapsible-content');

        // Ensure we have both the button and the collapsible list
        if (!btn || !collapsibleUl) return;

        // 2. Determine if any child link is active (for initial expansion)
        const hasActiveChild = collapsibleUl.querySelector('a.active') !== null;
        const startExpanded = hasActiveChild;

        // 3. Setup initial state and toggle icon
        if (!btn.querySelector('.sidebar-toggle-icon')) {
            const icon = document.createElement('span');
            icon.className = 'sidebar-toggle-icon';
            icon.textContent = '▼';
            btn.appendChild(icon);
            icon.style.transform = startExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
        }
        btn.setAttribute('aria-expanded', startExpanded);
        
        // Set initial visibility for the nested UL itself
        collapsibleUl.style.display = startExpanded ? '' : 'none';

        // 4. Click Handler to toggle the nested UL
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isExpanded = btn.getAttribute('aria-expanded') === 'true';
            const nextState = !isExpanded;
            
            btn.setAttribute('aria-expanded', nextState);
            const icon = btn.querySelector('.sidebar-toggle-icon');
            if(icon) {
              icon.style.transform = nextState ? 'rotate(0deg)' : 'rotate(-90deg)';
            }

            // Toggle the visibility of the nested UL
            collapsibleUl.style.display = nextState ? '' : 'none'; 
        });
    });
}

    // --- Sortable Tables (Preserved) ---
    function makeTableSortable(table) {
        const headers = table.tHead?.rows[0]?.cells;
        if (!headers) return;
    
        const tbody = table.tBodies[0];
        const originalOrder = Array.from(tbody.rows).map(row => row.cloneNode(true));
        let currentSort = { column: null, direction: 'none' };
    
        Array.from(headers).forEach((header, index) => {
            const sortBtn = document.createElement('span');
            sortBtn.className = 'sort-button';
            sortBtn.innerHTML = '<span class="arrow">▲</span><span class="arrow">▼</span>';
            header.appendChild(sortBtn);
    
            sortBtn.addEventListener('click', () => {
                let direction = 'asc';
                if (currentSort.column === index) {
                    direction = currentSort.direction === 'asc' ? 'desc' : currentSort.direction === 'desc' ? 'none' : 'asc';
                }
    
                table.querySelectorAll('.sort-button .arrow').forEach(a => a.classList.remove('active'));
    
                if (direction === 'none') {
                    resetToDefaultOrder(tbody, originalOrder);
                } else {
                    sortColumn(tbody, index, direction);
                    const arrows = sortBtn.querySelectorAll('.arrow');
                    arrows[direction === 'asc' ? 0 : 1].classList.add('active');
                }
    
                currentSort = { column: index, direction };
            });
        });
    }
    
    function sortColumn(tbody, colIndex, direction) {
        const rows = Array.from(tbody.rows);
        const isAsc = direction === 'asc';
        const sample = rows.map(r => r.cells[colIndex]?.textContent.trim()).find(v => v);
        const isNumeric = sample && /^-?\d+([.,]\d+)?$/.test(sample);
    
        rows.sort((a, b) => {
            let aVal = a.cells[colIndex]?.textContent.trim() || '';
            let bVal = b.cells[colIndex]?.textContent.trim() || '';
            if (isNumeric) {
                const aNum = parseFloat(aVal.replace(',', '.')) || 0;
                const bNum = parseFloat(bVal.replace(',', '.')) || 0;
                return isAsc ? aNum - bNum : bNum - aNum;
            } else {
                return isAsc ? aVal.localeCompare(bVal, undefined, { sensitivity: 'base' }) 
                             : bVal.localeCompare(aVal, undefined, { sensitivity: 'base' });
            }
        });
    
        rows.forEach(r => tbody.appendChild(r));
    }
    
    function resetToDefaultOrder(tbody, original) {
        tbody.innerHTML = '';
        original.forEach(r => tbody.appendChild(r.cloneNode(true)));
    }

    // --- Spoiler/Accordion ---
    function setupSpoilerLogic() {
        document.querySelectorAll('.spoiler-area').forEach(spoiler => {
            const header = spoiler.querySelector('.spoiler-header');
            
            const toggleDiv = document.createElement('div');
            toggleDiv.className = 'spoiler-toggle';
            toggleDiv.innerHTML = '<span class="icon">▼</span>';
            header.appendChild(toggleDiv);
            
            header.addEventListener('click', () => {
                spoiler.classList.toggle('open');
            });
        });
    }
    
    // --- Prev/Next Navigation ---
    function setupPrevNextNavigation() {
        const sidebarLinks = Array.from(document.querySelectorAll('#sidebar a[href]'));
        const current = window.location.pathname.split('/').pop().split('?')[0].split('#')[0];
        let currentIndex = sidebarLinks.findIndex(a => a.getAttribute('href') === current);
        
        // Fallback if current index is -1
        if (currentIndex === -1 && (current === '' || current === 'index.html')) {
            currentIndex = sidebarLinks.findIndex(a => a.getAttribute('href') === 'main2.html');
        }
      
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
      
        const prevLink = currentIndex > 0 ? sidebarLinks[currentIndex - 1] : null;
        const nextLink = currentIndex >= 0 && currentIndex < sidebarLinks.length - 1 ? sidebarLinks[currentIndex + 1] : null;
      
        if (prevLink) {
          prevBtn.onclick = () => location.href = prevLink.getAttribute('href');
          prevBtn.title = prevLink.textContent.trim();
        } else {
          prevBtn.classList.add('disabled');
        }
      
        if (nextLink) {
          nextBtn.onclick = () => location.href = nextLink.getAttribute('href');
          nextBtn.title = nextLink.textContent.trim();
        } else {
          nextBtn.classList.add('disabled');
        }
    }
    
    // --- Global Resize Handler ---
    const handleGlobalResize = debounce(() => {
        initializeSidebar();
    }, 150);
    
    const runOnLoad = () => {
        // 1. Assign global DOM elements (must happen after fetch)
        body = document.body;
        sidebar = document.getElementById('sidebar');

        // 2. Setup logic that depends on injected content
        setupThemeLogic();
        setupSidebarLogic();
        setActiveSidebarItem();
        setupPrevNextNavigation();
        setupSidebarCollapsibles(); 
        initializeSidebar();
        
        // 3. Initialize other DOM-dependent features
        document.querySelectorAll('table.sortable').forEach(makeTableSortable);
        setupSpoilerLogic();
        
        // 4. Attach resize listener
        window.addEventListener('resize', handleGlobalResize); 
    };

    // --- Global Initialization (Fetches) ---
    const initializeApp = async () => {
        
        // 1. Fetch Top Bar content
        try {
            const topBarContainer = document.getElementById('top-bar-container');
            const topBarResponse = await fetch('topbar.html');
            if (topBarResponse.ok) {
                topBarContainer.innerHTML = await topBarResponse.text();
            } else {
                console.error('Failed to load topbar.html');
                topBarContainer.innerHTML = '<p style="padding:0 2rem;">Error loading top bar.</p>';
            }
        } catch (e) {
            console.error('Error fetching top bar:', e);
            document.getElementById('top-bar-container').innerHTML = '<p style="padding:0 2rem;">Top bar requires web server (CORS).</p>';
        }

        // 2. Fetch Sidebar content
        try {
            const sidebarResponse = await fetch('sidebar.html');
            if (sidebarResponse.ok) {
                document.getElementById('sidebar').innerHTML = await sidebarResponse.text();
            } else {
                console.error('Failed to load sidebar.html');
                document.getElementById('sidebar').innerHTML = '<p style="padding:1rem;">Error loading sidebar.</p>';
            }
        } catch (e) {
            console.error('Error fetching sidebar:', e);
            document.getElementById('sidebar').innerHTML = '<p style="padding:1rem;">Sidebar requires web server (CORS).</p>';
        }

        // 3. Run setup functions after content is loaded
        runOnLoad();
    };
// Start the async chain
document.addEventListener('DOMContentLoaded', () => {
    // 1. Force the hidden state check immediately
    applyInitialSidebarState(); 
    
    // 2. Then proceed with the content fetching
    initializeApp();
});