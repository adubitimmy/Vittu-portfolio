import { gsap } from 'gsap';

// DOM Elements
const body = document.body;
const menuTrigger = document.getElementById('gallery-menu-trigger');
const fullMenu = document.getElementById('gallery-full-menu');
const closeMenuBtn = document.getElementById('close-gallery-menu');

const canvas = document.getElementById('paint-canvas');
const undoBtn = document.getElementById('undo-btn');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-btn');
const brushSizeSlider = document.getElementById('brush-size');
const brushSizeVal = document.getElementById('brush-size-val');

const tools = document.querySelectorAll('.tool-container');
const paintTubes = document.querySelectorAll('.paint-tube-swatch');
const paletteBlobs = document.querySelectorAll('.blob-hotspot');
const customColorPicker = document.getElementById('custom-color-picker');
const nativePickerWrapper = document.querySelector('.native-picker-wrapper');

// Drawing Engine State
let isDrawing = false;
let lastX = 0;
let lastY = 0;

let activeTool = 'round'; // round, flat, charcoal
let activeColor = '#1d4ed8'; // default blue
let activeSize = 8;

const undoHistory = [];
const maxHistory = 30;

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

  const menuLinks = document.querySelectorAll('.menu-link');
  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      fullMenu.classList.remove('active');
    });
  });
}

// --- 2. Initialize Canvas & Drawing Settings ---
let ctx = null;
if (canvas) {
  ctx = canvas.getContext('2d', { willReadFrequently: true });

  const resizeCanvas = () => {
    // Save current drawings before resize resets the canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Fill canvas white initially
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Restore previous artwork
    ctx.drawImage(tempCanvas, 0, 0);
  };

  // Wait a small timeout to let client bounding rect stabilize
  setTimeout(resizeCanvas, 100);
  window.addEventListener('resize', resizeCanvas);
}

// --- 3. Undo History Utilities ---
function saveCanvasState() {
  if (!canvas || !ctx) return;
  if (undoHistory.length >= maxHistory) {
    undoHistory.shift();
  }
  undoHistory.push(canvas.toDataURL());
}

function undo() {
  if (!canvas || !ctx || undoHistory.length === 0) return;
  const prevState = undoHistory.pop();
  const img = new Image();
  img.src = prevState;
  img.onload = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
}

// --- 4. Drawing Actions & Brush Mathematics ---
const draw = (e) => {
  if (!isDrawing || !canvas || !ctx) return;

  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
  const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

  ctx.strokeStyle = activeColor;
  ctx.fillStyle = activeColor;

  if (activeTool === 'round') {
    // Round brush: smooth continuous line with rounded ends
    ctx.lineWidth = activeSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

  } else if (activeTool === 'flat') {
    // Flat paintbrush: Ribbon filler polygon with dynamic rotation
    // Calculate scroll angle to align flat bristles
    const angle = Math.atan2(y - lastY, x - lastX);
    const perpX = Math.sin(angle);
    const perpY = -Math.cos(angle);
    
    const halfWidth = activeSize * 1.5;
    
    // Polygon points connecting last position to new position
    const x1_old = lastX - perpX * halfWidth;
    const y1_old = lastY - perpY * halfWidth;
    const x2_old = lastX + perpX * halfWidth;
    const y2_old = lastY + perpY * halfWidth;
    
    const x1_new = x - perpX * halfWidth;
    const y1_new = y - perpY * halfWidth;
    const x2_new = x + perpX * halfWidth;
    const y2_new = y + perpY * halfWidth;
    
    // Fill main ribbon
    ctx.beginPath();
    ctx.moveTo(x1_old, y1_old);
    ctx.lineTo(x2_old, y2_old);
    ctx.lineTo(x2_new, y2_new);
    ctx.lineTo(x1_new, y1_new);
    ctx.closePath();
    ctx.fill();

    // Render parallel bristle tracks for photorealistic paint texture
    ctx.lineCap = 'butt';
    const bristleTracks = 5;
    for (let i = 0; i < bristleTracks; i++) {
      const t = (i / (bristleTracks - 1)) - 0.5; // offset ratio between -0.5 and 0.5
      const offset = t * activeSize * 2.8;
      
      ctx.lineWidth = (activeSize * 2.8) / bristleTracks;
      ctx.globalAlpha = 0.4 + Math.random() * 0.4; // varied opacity bristles
      
      ctx.beginPath();
      ctx.moveTo(lastX - perpX * offset, lastY - perpY * offset);
      ctx.lineTo(x - perpX * offset, y - perpY * offset);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0; // reset transparency

  } else if (activeTool === 'charcoal') {
    // Charcoal stick: textured, grainy carbon particle dispersal
    const distance = Math.hypot(x - lastX, y - lastY);
    const steps = Math.max(1, Math.floor(distance / 2));
    
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const cx = lastX + (x - lastX) * t;
      const cy = lastY + (y - lastY) * t;
      
      const particleCount = Math.floor(activeSize * 1.8);
      for (let i = 0; i < particleCount; i++) {
        // Disperse particles randomly inside a circular brush radius
        const radius = Math.random() * (activeSize / 2);
        const angle = Math.random() * Math.PI * 2;
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;
        
        ctx.globalAlpha = Math.random() * 0.35; // carbon grains opacity
        ctx.fillRect(px, py, 1.2, 1.2);
      }
    }
    ctx.globalAlpha = 1.0;
  }

  [lastX, lastY] = [x, y];
};

const startDrawing = (e) => {
  if (!canvas || !ctx) return;
  saveCanvasState(); // Save undo state before making a stroke
  isDrawing = true;

  const rect = canvas.getBoundingClientRect();
  lastX = ((e.clientX || (e.touches && e.touches[0].clientX)) - rect.left);
  lastY = ((e.clientY || (e.touches && e.touches[0].clientY)) - rect.top);
};

const stopDrawing = () => {
  isDrawing = false;
};

// Pointer Events (Touch, Mouse, Stylus compatibility)
if (canvas) {
  canvas.addEventListener('pointerdown', startDrawing);
  canvas.addEventListener('pointermove', draw);
  canvas.addEventListener('pointerup', stopDrawing);
  canvas.addEventListener('pointerout', stopDrawing);
}

// --- 5. Toolbar Actions (Undo, Clear, Save, Size) ---
if (undoBtn) {
  undoBtn.addEventListener('click', undo);
}

if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    if (!canvas || !ctx) return;
    saveCanvasState(); // save blank state so clear is undoable!
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
}

if (saveBtn) {
  saveBtn.addEventListener('click', () => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `samuel-vittu-studio-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  });
}

if (brushSizeSlider && brushSizeVal) {
  brushSizeSlider.addEventListener('input', (e) => {
    activeSize = parseInt(e.target.value);
    brushSizeVal.textContent = `${activeSize}px`;
  });
}

// --- 6. Tool Tray Selectors ---
tools.forEach(tool => {
  tool.addEventListener('click', () => {
    tools.forEach(t => t.classList.remove('selected'));
    tool.classList.add('selected');
    activeTool = tool.getAttribute('data-tool');
  });
});

// Update all color indicators across swatches, palette, and native inputs
function selectColor(colorCode) {
  activeColor = colorCode;
  
  // 1. Sync paint tubes active classes
  paintTubes.forEach(tube => {
    if (tube.getAttribute('data-color').toLowerCase() === colorCode.toLowerCase()) {
      tube.classList.add('active');
    } else {
      tube.classList.remove('active');
    }
  });

  // 2. Sync palette picker blobs
  paletteBlobs.forEach(blob => {
    if (blob.getAttribute('data-color').toLowerCase() === colorCode.toLowerCase()) {
      blob.classList.add('active');
    } else {
      blob.classList.remove('active');
    }
  });

  // 3. Sync native picker
  customColorPicker.value = colorCode;
  nativePickerWrapper.style.backgroundColor = colorCode;
}

// Bind quick swatches paint tubes
paintTubes.forEach(tube => {
  tube.addEventListener('click', () => {
    const color = tube.getAttribute('data-color');
    selectColor(color);
  });
});

// Bind palette hotspots
paletteBlobs.forEach(blob => {
  blob.addEventListener('click', () => {
    const color = blob.getAttribute('data-color');
    selectColor(color);
  });
});

// Bind fallback custom color picker pot
if (customColorPicker) {
  customColorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    selectColor(color);
  });
  
  // Initialize native picker pot color
  nativePickerWrapper.style.backgroundColor = customColorPicker.value;
}

// Initialize active color UI
selectColor(activeColor);
