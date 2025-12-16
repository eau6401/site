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
  // Get the full pathname (e.g., '/pages/doc.html')
  const fullPath = window.location.pathname;
  
  // Also get just the filename for fallback matching
  const filename = fullPath.split('/').pop().split('?')[0].split('#')[0];
  const cleanFilename = filename === '' ? 'index.html' : filename;
  
  document.querySelectorAll('#sidebar a').forEach(link => {
      const href = link.getAttribute('href');
      
      // Check if the href matches either:
      // 1. The full pathname (e.g., '/pages/doc.html' === '/pages/doc.html')
      // 2. Just the filename (e.g., 'doc.html' === 'doc.html')
      // 3. The href ends with the current path (for relative links)
      const isActive = 
          href === fullPath ||                    // Exact match with full path
          href === cleanFilename ||               // Match just filename
          fullPath.endsWith(href) ||              // Path ends with href
          (href.startsWith('/') && fullPath === href); // Absolute path match
      
      link.classList.toggle('active', isActive);
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

// --- Prev/Next Navigation ---
function setActiveSidebarItem() {
  // Get the full pathname (e.g., '/pages/doc.html')
  const fullPath = window.location.pathname;
  
  // Also get just the filename for fallback matching
  const filename = fullPath.split('/').pop().split('?')[0].split('#')[0];
  const cleanFilename = filename === '' ? 'index.html' : filename;
  
  document.querySelectorAll('#sidebar a').forEach(link => {
      const href = link.getAttribute('href');
      
      // Check if the href matches either:
      // 1. The full pathname (e.g., '/pages/doc.html' === '/pages/doc.html')
      // 2. Just the filename (e.g., 'doc.html' === 'doc.html')
      // 3. The href ends with the current path (for relative links)
      const isActive = 
          href === fullPath ||                    // Exact match with full path
          href === cleanFilename ||               // Match just filename
          fullPath.endsWith(href) ||              // Path ends with href
          (href.startsWith('/') && fullPath === href); // Absolute path match
      
      link.classList.toggle('active', isActive);
  });
}

// --- Prev/Next Navigation ---
function setupPrevNextNavigation() {
  const sidebarLinks = Array.from(document.querySelectorAll('#sidebar a[href]'));
  const fullPath = window.location.pathname;
  const filename = fullPath.split('/').pop().split('?')[0].split('#')[0];
  const cleanFilename = filename === '' ? 'index.html' : filename;
  
  // Find current index using the same matching logic as setActiveSidebarItem
  let currentIndex = sidebarLinks.findIndex(link => {
      const href = link.getAttribute('href');
      return href === fullPath || 
             href === cleanFilename || 
             fullPath.endsWith(href) ||
             (href.startsWith('/') && fullPath === href);
  });
  
  // Fallback: if still not found and we're on root/index
  if (currentIndex === -1 && (cleanFilename === 'index.html' || fullPath === '/')) {
      currentIndex = sidebarLinks.findIndex(a => {
          const href = a.getAttribute('href');
          return href === 'index.html' || href === '/' || href === '/index.html';
      });
  }

  const prevBtn = document.querySelector('#top-bar-container #prev-page');
  const nextBtn = document.querySelector('#top-bar-container #next-page');
  if (!prevBtn || !nextBtn) return;

  const prevLink = currentIndex > 0 ? sidebarLinks[currentIndex - 1] : null;
  const nextLink = currentIndex >= 0 && currentIndex < sidebarLinks.length - 1 ? sidebarLinks[currentIndex + 1] : null;

  if (prevLink) {
      prevBtn.onclick = () => location.href = prevLink.getAttribute('href');
      prevBtn.title = prevLink.textContent.trim();
      prevBtn.classList.remove('disabled');
  } else {
      prevBtn.classList.add('disabled');
      prevBtn.onclick = null;
  }

  if (nextLink) {
      nextBtn.onclick = () => location.href = nextLink.getAttribute('href');
      nextBtn.title = nextLink.textContent.trim();
      nextBtn.classList.remove('disabled');
  } else {
      nextBtn.classList.add('disabled');
      nextBtn.onclick = null;
  }
}

// --- Global Resize Handler ---
const handleGlobalResize = debounce(() => {
    initializeSidebar();
}, 150);

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('textarea[readonly]').forEach(ta => {
    let lines = ta.value.split('\n');
    
    // Remove first empty line if exists
    if (lines[0] === '') lines.shift();
    // Remove last empty line if exists
    else if (lines[lines.length - 1] === '') lines.pop();
    
    ta.value = lines.join('\n');
    ta.rows = lines.length;
    ta.wrap = "off";
    
  });
});

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

    // 4. Attach resize listener
    window.addEventListener('resize', handleGlobalResize); 
};

const initializeApp = async () => {

  // 1. Fetch Top Bar content
  try {
      const topBarContainer = document.getElementById('top-bar-container');
      const topbarPath = topBarContainer.dataset.src || 'topbar.html';
      const topBarResponse = await fetch(topbarPath);
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
      const sidebar = document.getElementById('sidebar');
      const sidebarPath = sidebar.dataset.src || 'sidebar.html';
      const sidebarResponse = await fetch(sidebarPath);
      if (sidebarResponse.ok) {
          sidebar.innerHTML = await sidebarResponse.text();
      } else {
          console.error('Failed to load sidebar.html');
          sidebar.innerHTML = '<p style="padding:1rem;">Error loading sidebar.</p>';
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