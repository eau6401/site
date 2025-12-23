// --- Global Variables (Declared with 'let' to be assigned after fetch) ---
let settingsToggle, settingsMenu, settingsItems, menuToggle;

let currentTheme = localStorage.getItem('theme') || 'auto';
let body = document.body;
let sidebar = document.getElementById('sidebar');
(function() {
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (currentTheme === 'dark' || (currentTheme === 'auto' && prefersDark)) {
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
        // Force the 'hidden' class to be applied instantly
        sidebar.classList.add('hidden');
    } else {
        sidebar.classList.remove('hidden');
    }
}
}

// --- Theme Management ---
function applyTheme(theme) {
    settingsItems.forEach(i => i.classList.toggle('active', i.dataset.theme === theme));
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    body.classList.toggle('dark-theme', theme === 'dark' || (theme === 'auto' && prefersDark));
    localStorage.setItem('theme', theme);
}

function setupThemeLogic() {
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

// --- Sidebar Collapsible Logic ---
function setupSidebarCollapsibles() {
  document.querySelectorAll('#sidebar .sidebar-row > button').forEach(btn => {
    const ul = btn.parentElement.nextElementSibling;
    if (!ul || ul.tagName !== 'UL') return;

    const parentLink = btn.previousElementSibling;
    const hasActiveChild = ul.querySelector('a.active') !== null;
    const parentIsActive = parentLink && parentLink.classList.contains('active');
    
    const expanded = hasActiveChild || parentIsActive;
    
    if (expanded) {
      btn.classList.add('open');
    } else {
      ul.hidden = true;
    }

    btn.onclick = e => {
      e.preventDefault();
      btn.classList.toggle('open');
      ul.hidden = !ul.hidden;
    };
  });
}

// --- Sidebar navigation ---
function setActiveSidebarItem() {
  const fullPath = window.location.pathname;
  
  const filename = fullPath.split('/').pop().split('?')[0].split('#')[0];
  const cleanFilename = filename === '' ? 'index.html' : filename;
  
  document.querySelectorAll('#sidebar a').forEach(link => {
      const href = link.getAttribute('href');
      
      const isActive = 
          href === fullPath ||
          href === cleanFilename ||
          fullPath.endsWith(href) ||
          (href.startsWith('/') && fullPath === href);
      
      link.classList.toggle('active', isActive);
  });
}

// --- Prev/Next Navigation ---
function setupPrevNextNavigation() {
  const sidebarLinks = Array.from(document.querySelectorAll('#sidebar a[href]'));
  const fullPath = window.location.pathname;
  const filename = fullPath.split('/').pop().split('?')[0].split('#')[0];
  const cleanFilename = filename === '' ? 'index.html' : filename;
  
  let currentIndex = sidebarLinks.findIndex(link => {
      const href = link.getAttribute('href');
      return href === fullPath || 
             href === cleanFilename || 
             fullPath.endsWith(href) ||
             (href.startsWith('/') && fullPath === href);
  });

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

function setupExternalLinks() {
  // Select every anchor tag on the page
  const links = document.querySelectorAll('a[href]');
  
  links.forEach(link => {
    // Check if the link's hostname is different from the current site's hostname
    // Also ensures it's an actual web link (http/https)
    if (link.hostname && link.hostname !== window.location.hostname) {
      link.setAttribute('target', '_blank');
      
      // Security Best Practice: prevent the new page from accessing your window object
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

// --- Global Resize Handler ---
const handleGlobalResize = debounce(() => {
    initializeSidebar();
}, 150);

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('textarea[readonly]').forEach(ta => {
    let lines = ta.value.split('\n');
    
    if (lines[0] === '') lines.shift();
    else if (lines[lines.length - 1] === '') lines.pop();
    
    ta.value = lines.join('\n');
    ta.rows = lines.length;
    ta.wrap = "off";
    
  });
});

const runOnLoad = () => {
    body = document.body;
    sidebar = document.getElementById('sidebar');

    setupThemeLogic();
    setupSidebarLogic();
    setActiveSidebarItem();
    setupPrevNextNavigation();
    setupSidebarCollapsibles(); 
    initializeSidebar();
    setupExternalLinks();

    window.addEventListener('resize', handleGlobalResize); 
};

const initializeApp = async () => {

  const topBarContainer = document.getElementById('top-bar-container');
  const sidebar = document.getElementById('sidebar');
  
  const topbarPath = topBarContainer.dataset.src || 'topbar.html';
  const sidebarPath = sidebar.dataset.src || 'sidebar.html';

  try {
      const [topBarResponse, sidebarResponse] = await Promise.all([
          fetch(topbarPath),
          fetch(sidebarPath)
      ]);

      if (topBarResponse.ok) {
          topBarContainer.innerHTML = await topBarResponse.text();
      } else {
          console.error('Failed to load topbar.html');
          topBarContainer.innerHTML = '<p style="padding:0 2rem;">Error loading top bar.</p>';
      }

      if (sidebarResponse.ok) {
          sidebar.innerHTML = await sidebarResponse.text();
      } else {
          console.error('Failed to load sidebar.html');
          sidebar.innerHTML = '<p style="padding:1rem;">Error loading sidebar.</p>';
      }

  } catch (e) {
      console.error('Error fetching content:', e);
      topBarContainer.innerHTML = '<p style="padding:0 2rem;">Top bar requires web server (CORS).</p>';
      sidebar.innerHTML = '<p style="padding:1rem;">Sidebar requires web server (CORS).</p>';
  }

  runOnLoad();
};

/*
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
*/

document.addEventListener('DOMContentLoaded', () => {
// Force the hidden state check immediately
applyInitialSidebarState(); 

initializeApp();
});