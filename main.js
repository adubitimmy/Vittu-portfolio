// Artwork Data
const artworkData = {
  'mercury-garden': {
    title: 'Mercury Garden',
    medium: 'Oil, sand, and wax',
    image: '/assets/img01.png',
    dims: '180 × 210 cm',
    year: '2025',
    desc: 'Mercury Garden explores the intersection between organic alchemy and texture. Built with thick layers of oil paint blended with volcanic sand and beeswax, the surface is carved and scraped to reveal vibrant underlayers of mineral green and sulfur yellow.'
  },
  'blue-room': {
    title: 'Blue Room Memory',
    medium: 'Pigment on linen',
    image: '/assets/img05.png',
    dims: '200 × 300 cm (Diptych)',
    year: '2026',
    desc: 'A profound exploration of interior architectures and shadowplay, Blue Room Memory uses raw pigments bound in egg tempera. The diptych formats a narrative pull between figures, suspended in a dense, velvety indigo background.'
  },
  'ritual': {
    title: 'Ritual for Afternoon',
    medium: 'Acrylic and charcoal',
    image: '/assets/img02.png',
    dims: '140 × 140 cm',
    year: '2025',
    desc: 'Balancing classical composition with raw graffiti elements, Ritual for Afternoon is a high-contrast piece in shades of violet and deep charcoal. The canvas captures a moment of weightless release within an ornate architectural dome.'
  }
};

// DOM Elements
const body = document.body;
const openMenuBtn = document.getElementById('open-menu');
const closeMenuBtn = document.getElementById('close-menu');
const fullMenu = document.getElementById('full-menu');
const artworkModal = document.getElementById('artwork-modal');
const closeModalBtn = document.getElementById('close-modal');

// --- 1. Fullscreen Menu Logic ---
if (openMenuBtn && closeMenuBtn && fullMenu) {
  openMenuBtn.addEventListener('click', () => {
    fullMenu.classList.add('active');
  });

  closeMenuBtn.addEventListener('click', () => {
    fullMenu.classList.remove('active');
  });

  // Close menu on link click
  const menuLinks = document.querySelectorAll('.menu-link');
  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      fullMenu.classList.remove('active');
      const targetId = link.getAttribute('data-target');
      
      if (targetId === 'hero') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (targetId === 'works') {
        document.getElementById('works-section')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Fallback smooth scroll to sections if added later
        const targetSec = document.getElementById(targetId);
        if (targetSec) {
          targetSec.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
}

// --- 2. Gallery Modal Logic ---
const workCards = document.querySelectorAll('.work-card');
if (artworkModal) {
  workCards.forEach(card => {
    card.addEventListener('click', () => {
      const workId = card.getAttribute('data-work-id');
      const data = artworkData[workId];
      if (data) {
        document.getElementById('modal-img').src = data.image;
        document.getElementById('modal-img').alt = data.title;
        document.getElementById('modal-title').innerText = data.title;
        document.getElementById('modal-medium').innerText = data.medium;
        document.getElementById('modal-desc').innerText = data.desc;
        document.getElementById('modal-dims').innerText = data.dims;
        document.getElementById('modal-year').innerText = data.year;
        
        artworkModal.classList.add('active');
        body.style.overflow = 'hidden'; // Lock background scroll
      }
    });
  });

  closeModalBtn.addEventListener('click', () => {
    artworkModal.classList.remove('active');
    body.style.overflow = ''; // Restore scroll
  });

  artworkModal.addEventListener('click', (e) => {
    if (e.target === artworkModal) {
      artworkModal.classList.remove('active');
      body.style.overflow = '';
    }
  });
}

// --- 3. Interactive Clipboard Painting Canvas ---
const canvas = document.getElementById('paint-canvas');
const clearBtn = document.getElementById('clear-btn');

if (canvas) {
  const ctx = canvas.getContext('2d');
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  // Set canvas resolution to match its displayed size
  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Clear and fill canvas white initially
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Wait a small timeout to let client bounding rect stabilize
  setTimeout(resizeCanvas, 100);
  window.addEventListener('resize', resizeCanvas);

  // Drawing Styles (Simulating oil painting brush strokes)
  const draw = (e) => {
    if (!isDrawing) return;

    // Get correct mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.strokeStyle = '#ff3c4d'; // Samuel's primary brand red
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 14;

    // Draw main textured stroke (multiple overlapping semi-transparent lines)
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Bristle effect: helper lines around core line
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.25;
    for (let i = -4; i <= 4; i += 2) {
      ctx.beginPath();
      ctx.moveTo(lastX + i, lastY + i);
      ctx.lineTo(x + i, y + i);
      ctx.stroke();
    }

    [lastX, lastY] = [x, y];
  };

  const startDrawing = (e) => {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = ((e.clientX || e.touches[0].clientX) - rect.left);
    lastY = ((e.clientY || e.touches[0].clientY) - rect.top);
  };

  const stopDrawing = () => {
    isDrawing = false;
  };

  // Mouse Listeners
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);

  // Touch Listeners (Mobile compatibility)
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrawing(e);
  });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e);
  });
  canvas.addEventListener('touchend', stopDrawing);

  // Clear button logic
  clearBtn.addEventListener('click', () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
}

// --- 4. Smooth Inertia Parallax Effect ---
const bgItems = document.querySelectorAll('.p-bg-item');
const fgElements = document.querySelectorAll('.fg-element');

// Smooth mouse positioning variables
let targetMouseX = 0;
let targetMouseY = 0;
let currentMouseX = 0;
let currentMouseY = 0;

window.addEventListener('mousemove', (e) => {
  // Normalize coordinates around screen center (-1 to 1)
  targetMouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
  targetMouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
});

// Update function running on requestAnimationFrame
const updateParallax = () => {
  // Linear interpolation (lerp) for smooth lagging effect
  currentMouseX += (targetMouseX - currentMouseX) * 0.1;
  currentMouseY += (targetMouseY - currentMouseY) * 0.1;

  // Background blurred items (shift opposite to mouse for depth)
  bgItems.forEach(item => {
    const depth = parseFloat(item.style.getPropertyValue('--depth')) || 0.1;
    const x = -currentMouseX * depth * 80;
    const y = -currentMouseY * depth * 80;
    item.style.setProperty('--tx', `${x}px`);
    item.style.setProperty('--ty', `${y}px`);
  });

  // Foreground sharp items (shift same direction as mouse for overlay pop)
  fgElements.forEach(elem => {
    const depth = parseFloat(elem.style.getPropertyValue('--depth')) || 0.3;
    const x = currentMouseX * depth * 60;
    const y = currentMouseY * depth * 60;
    elem.style.setProperty('--tx', `${x}px`);
    elem.style.setProperty('--ty', `${y}px`);
  });

  requestAnimationFrame(updateParallax);
};

// Start update loop
requestAnimationFrame(updateParallax);
