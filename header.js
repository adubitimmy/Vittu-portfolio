// Shared Header & Fullscreen Menu Component Injection
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;

  // Determine active state based on page URL path
  const isHome = currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/');
  const isClassic = currentPath.includes('/classic.html');
  const isWorks = currentPath.includes('/works.html');

  // Dynamic header highlight button destination
  let highlightHref = '/classic.html';
  let highlightText = 'Interactive Studio';
  if (isClassic) {
    highlightHref = '/';
    highlightText = 'Virtual Gallery';
  }

  // Define Header Inner HTML
  const headerHTML = `
    <div class="gallery-logo">
      <a href="/" style="color: inherit; text-decoration: none;">Samuel Vittu</a>
    </div>
    <nav class="gallery-nav">
      <a href="${highlightHref}" class="nav-link-btn highlight-link">${highlightText}</a>
      <button class="nav-menu-btn" id="gallery-menu-trigger">
        <span>Menu</span>
        <div class="menu-dot"></div>
      </button>
    </nav>
  `;

  // Define Fullscreen Menu Inner HTML
  const menuHTML = `
    <button class="close-menu-btn" id="close-gallery-menu">&times;</button>
    <nav class="menu-nav">
      <a href="/" class="menu-link ${isHome ? 'active' : ''}">Virtual Gallery</a>
      <a href="/classic.html" class="menu-link ${isClassic ? 'active' : ''}">Interactive Studio</a>
      <a href="/works.html" class="menu-link ${isWorks ? 'active' : ''}">Exhibitions</a>
      <a href="#" class="menu-link">Biography</a>
      <a href="#" class="menu-link">Contact</a>
    </nav>
  `;

  // Inject into placeholders, or prepend/append dynamically if they don't exist
  const headerElement = document.querySelector('header.gallery-header');
  if (headerElement) {
    headerElement.innerHTML = headerHTML;
  } else {
    const newHeader = document.createElement('header');
    newHeader.className = 'gallery-header';
    newHeader.innerHTML = headerHTML;
    document.body.prepend(newHeader);
  }

  let fullMenu = document.getElementById('gallery-full-menu');
  if (fullMenu) {
    fullMenu.innerHTML = menuHTML;
  } else {
    fullMenu = document.createElement('div');
    fullMenu.id = 'gallery-full-menu';
    fullMenu.className = 'fullscreen-menu';
    fullMenu.innerHTML = menuHTML;
    document.body.appendChild(fullMenu);
  }

  // Bind Menu open and close event listeners
  const menuTrigger = document.getElementById('gallery-menu-trigger');
  const closeMenu = document.getElementById('close-gallery-menu');

  if (menuTrigger && fullMenu) {
    menuTrigger.addEventListener('click', () => {
      fullMenu.classList.add('active');
      if (typeof gsap !== 'undefined') {
        gsap.fromTo('.menu-link', 
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
        );
      }
    });
  }

  if (closeMenu && fullMenu) {
    closeMenu.addEventListener('click', () => {
      fullMenu.classList.remove('active');
    });
  }
});
