import { gsap } from 'gsap';

// DOM Elements
const body = document.body;
const menuTrigger = document.getElementById('gallery-menu-trigger');
const fullMenu = document.getElementById('gallery-full-menu');
const closeMenuBtn = document.getElementById('close-gallery-menu');

// --- 1. Fullscreen Menu Logic ---
if (menuTrigger && closeMenuBtn && fullMenu) {
  menuTrigger.addEventListener('click', () => {
    fullMenu.classList.add('active');
    gsap.fromTo('.menu-link', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
    );
  });

  closeMenuBtn.addEventListener('click', () => {
    fullMenu.classList.remove('active');
  });

  // Close menu on link click
  const menuLinks = document.querySelectorAll('.menu-link');
  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      fullMenu.classList.remove('active');
    });
  });
}

// --- 2. Interactive Clipboard Painting Canvas ---
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

// --- 3. Smooth Inertia Parallax Effect ---
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
