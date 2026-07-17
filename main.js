import { gsap } from 'gsap';
import artworksData from './artworks.json';

// DOM Elements
const rowShelf1 = document.getElementById('row-shelf-1');
const rowShelf2 = document.getElementById('row-shelf-2');
const galleryModal = document.getElementById('gallery-modal');
const modalArtworkImg = document.getElementById('modal-artwork-img');
const modalArtworkTitle = document.getElementById('modal-artwork-title');
const modalArtworkYear = document.getElementById('modal-artwork-year');
const modalArtworkMedium = document.getElementById('modal-artwork-medium');
const modalArtworkDims = document.getElementById('modal-artwork-dims');
const modalArtworkExhibition = document.getElementById('modal-artwork-exhibition');
const modalArtworkDesc = document.getElementById('modal-artwork-desc');
const prevBtn = document.getElementById('prev-artwork-btn');
const nextBtn = document.getElementById('next-artwork-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalBackdrop = document.querySelector('.modal-backdrop');
const flipCardElement = document.getElementById('modal-flip-card-element');
const flipCardInner = flipCardElement.querySelector('.flip-card-inner');



// State
let currentArtworkIndex = 0;
let activeShelfCard = null;

// 1. Initialize Virtual Gallery
function initializeGallery() {
  // Populate first 11 artworks on Shelf 1
  const shelf1Works = artworksData.slice(0, 11);
  shelf1Works.forEach((artwork, index) => {
    const card = createArtworkCard(artwork, index);
    rowShelf1.appendChild(card);
  });

  // Append special "View More" Card as the 12th item on Shelf 1
  const viewMoreCard = createViewMoreCard();
  rowShelf1.appendChild(viewMoreCard);

  // Populate remaining 13 artworks on Shelf 2
  const shelf2Works = artworksData.slice(11);
  shelf2Works.forEach((artwork, index) => {
    // Keep absolute index reference for modal sync
    const card = createArtworkCard(artwork, index + 11);
    rowShelf2.appendChild(card);
  });

  setupTimelineInteraction();
  setupInertiaScroll();
  setupDragScroll();
}

function createArtworkCard(artwork, index) {
  const card = document.createElement('div');
  card.className = 'artwork-card idle-float';
  card.setAttribute('data-id', artwork.id);
  card.setAttribute('data-index', index);
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-label', `${artwork.title}. ${artwork.medium}, ${artwork.year}.`);

  // Randomize floating animation phase offset
  card.style.animationDelay = `${Math.random() * -6}s`;

  card.innerHTML = `
    <div class="artwork-card-inner">
      <div class="card-canvas-box">
        <img src="${artwork.image}" alt="${artwork.title} - Oil Painting by Samuel Vittu" loading="lazy">
        <div class="card-sheen"></div>
        <div class="card-hover-overlay">
          <div class="hover-metadata">
            <div class="hover-title">${artwork.title}</div>
            <div class="hover-year">${artwork.year}</div>
          </div>
          <div class="hover-btns">
            <button class="card-btn card-btn-view" data-action="view" tabindex="-1">View</button>
            <button class="card-btn card-btn-dark card-btn-details" data-action="details" tabindex="-1">Details</button>
          </div>
        </div>
      </div>
    </div>
  `;

  setupCardInteractions(card);
  return card;
}

function createViewMoreCard() {
  const card = document.createElement('a');
  card.href = '/works.html';
  card.className = 'view-more-card idle-float';
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-label', 'View full works collection grid');
  card.style.animationDelay = `${Math.random() * -6}s`;

  card.innerHTML = `
    <div class="view-more-card-inner">
      <div class="view-more-content">
        <div class="view-more-icon">&rarr;</div>
        <div class="view-more-text">View More</div>
      </div>
    </div>
  `;
  return card;
}

// 2. Click Interactivity
function setupCardInteractions(card) {
  card.addEventListener('click', () => {
    const index = parseInt(card.getAttribute('data-index'));
    openArtworkModal(index, card);
  });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const index = parseInt(card.getAttribute('data-index'));
      openArtworkModal(index, card);
    }
  });
}

// 3. Horizontal Inertia Sway & Scroll Lag
function setupInertiaScroll() {
  const rows = document.querySelectorAll('.artwork-row');

  rows.forEach(row => {
    row.addEventListener('scroll', () => {
      const cards = row.children;
      const rowRect = row.getBoundingClientRect();
      const rowCenter = rowRect.left + rowRect.width / 2;

      Array.from(cards).forEach((card) => {
        // Target either painting inner card or view more inner card
        const inner = card.querySelector('.artwork-card-inner') || card.querySelector('.view-more-card-inner');
        if (!inner) return;

        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distance = cardCenter - rowCenter;

        // Normalize distance ratio between -1 and 1
        const maxDistance = rowRect.width;
        const ratio = Math.max(-1, Math.min(1, distance / maxDistance));

        // GSAP animate translation and 3D Y-rotation to simulate cylindrical lag
        gsap.to(inner, {
          x: ratio * -24,          // subtle lag behind scroll direction
          rotationY: ratio * -12,  // cylindrical wrap rotation
          duration: 0.6,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      });
    });
  });
}

// 3b. Drag to Scroll with Click Prevention
function setupDragScroll() {
  const rows = document.querySelectorAll('.artwork-row');

  rows.forEach(row => {
    let isDown = false;
    let startX;
    let scrollLeft;
    const dragThreshold = 5;
    let hasDragged = false;

    row.addEventListener('mousedown', (e) => {
      // Don't drag-scroll if we clicked key controls or dynamic links directly
      if (e.target.closest('.hover-btns') || e.target.closest('button') || e.target.closest('a')) return;
      isDown = true;
      startX = e.pageX - row.offsetLeft;
      scrollLeft = row.scrollLeft;
      hasDragged = false;
    });

    row.addEventListener('mouseleave', () => {
      isDown = false;
    });

    row.addEventListener('mouseup', (e) => {
      isDown = false;
      
      // If the mouse was dragged, intercept the browser click event so the detail modal doesn't open
      if (hasDragged) {
        const preventClick = (clickEvent) => {
          clickEvent.stopImmediatePropagation();
          clickEvent.preventDefault();
          row.removeEventListener('click', preventClick, true);
        };
        row.addEventListener('click', preventClick, true);
      }
    });

    row.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const x = e.pageX - row.offsetLeft;
      const walk = (x - startX) * 1.5; // Drag speed multiplier

      if (Math.abs(walk) > dragThreshold) {
        hasDragged = true;
      }

      if (hasDragged) {
        e.preventDefault();
        row.scrollLeft = scrollLeft - walk;
      }
    });
  });
}

// 4. GSAP Flight Modal Animation
function openArtworkModal(index, cardElement) {
  currentArtworkIndex = index;
  activeShelfCard = cardElement;
  const artwork = artworksData[index];

  // Set details and reset flip card to its front face
  updateModalContent(artwork);
  flipCardInner.classList.remove('flipped');

  const cardRect = cardElement.getBoundingClientRect();
  const innerCard = cardElement.querySelector('.artwork-card-inner');
  const modalWrapper = galleryModal.querySelector('.modal-wrapper');

  // Hide shelf card
  gsap.set(innerCard, { opacity: 0 });

  // Open modal portal
  galleryModal.classList.add('active');
  galleryModal.setAttribute('aria-hidden', 'false');

  // Calculate delta
  const wrapperRect = modalWrapper.getBoundingClientRect();
  const startX = cardRect.left + (cardRect.width / 2) - (wrapperRect.left + (wrapperRect.width / 2));
  const startY = cardRect.top + (cardRect.height / 2) - (wrapperRect.top + (wrapperRect.height / 2));

  // Set flight start bounds on modal wrapper
  gsap.set(modalWrapper, {
    x: startX,
    y: startY,
    scaleX: cardRect.width / wrapperRect.width,
    scaleY: cardRect.height / wrapperRect.height,
    rotationY: -180, // spin on flight entry
    rotationZ: -10,
    opacity: 0.8
  });

  // Run flight to center
  gsap.to(modalWrapper, {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotationY: 0,
    rotationZ: 0,
    opacity: 1,
    duration: 0.8,
    ease: 'power4.out',
    clearProps: 'transform,rotationY,rotationZ'
  });

  // Fade backdrop
  gsap.fromTo(modalBackdrop, { opacity: 0 }, { opacity: 1, duration: 0.45 });

  // Set focus on close button
  setTimeout(() => closeModalBtn.focus(), 100);
}

function updateModalContent(artwork) {
  modalArtworkImg.src = artwork.image;
  modalArtworkImg.alt = `${artwork.title} - Oil painting by Samuel Vittu`;
  modalArtworkTitle.textContent = artwork.title;
  modalArtworkYear.textContent = artwork.year;
  modalArtworkMedium.textContent = artwork.medium;
  modalArtworkDims.textContent = artwork.dimensions;
  modalArtworkExhibition.textContent = artwork.exhibition;
  modalArtworkDesc.textContent = artwork.description;
}

// 5. Modal Click-to-Flip handler
flipCardElement.addEventListener('click', (e) => {
  if (e.target.closest('button') || e.target.closest('a')) return;
  flipCardInner.classList.toggle('flipped');
});

// Close Modal with Reverse Spin-back
function closeArtworkModal() {
  if (!activeShelfCard) return;

  const performCloseFlight = () => {
    const cardRect = activeShelfCard.getBoundingClientRect();
    const innerCard = activeShelfCard.querySelector('.artwork-card-inner');
    const modalWrapper = galleryModal.querySelector('.modal-wrapper');

    const wrapperRect = modalWrapper.getBoundingClientRect();
    const targetX = cardRect.left + (cardRect.width / 2) - (wrapperRect.left + (wrapperRect.width / 2));
    const targetY = cardRect.top + (cardRect.height / 2) - (wrapperRect.top + (wrapperRect.height / 2));

    gsap.to(modalWrapper, {
      x: targetX,
      y: targetY,
      scaleX: cardRect.width / wrapperRect.width,
      scaleY: cardRect.height / wrapperRect.height,
      rotationY: 180,
      rotationZ: 10,
      opacity: 0.5,
      duration: 0.75,
      ease: 'power3.inOut',
      onComplete: () => {
        galleryModal.classList.remove('active');
        galleryModal.setAttribute('aria-hidden', 'true');
        gsap.set(modalWrapper, { clearProps: 'all' });
        
        // Show shelf card again
        gsap.set(innerCard, { opacity: 1 });
        activeShelfCard.focus();
        activeShelfCard = null;
      }
    });

    gsap.to(modalBackdrop, { opacity: 0, duration: 0.4 });
  };

  // If card is showing backing info, flip back to painting front first
  if (flipCardInner.classList.contains('flipped')) {
    flipCardInner.classList.remove('flipped');
    setTimeout(performCloseFlight, 350); // wait for flip transition midpoint
  } else {
    performCloseFlight();
  }
}

// 6. Modal Navigation Controls (Next/Prev)
function navigateModal(direction) {
  flipCardInner.classList.remove('flipped');

  let nextIndex = currentArtworkIndex + direction;
  
  if (nextIndex >= artworksData.length) {
    nextIndex = 0;
  } else if (nextIndex < 0) {
    nextIndex = artworksData.length - 1;
  }

  const artwork = artworksData[nextIndex];

  // Transition the flip card container
  gsap.to(flipCardElement, {
    opacity: 0,
    x: direction * -40,
    rotationY: direction * -15,
    duration: 0.35,
    onComplete: () => {
      currentArtworkIndex = nextIndex;
      updateModalContent(artwork);
      
      // Sync active shelf card reference
      const targetCard = document.querySelector(`.artwork-card[data-id="${artwork.id}"]`);
      if (targetCard) {
        if (activeShelfCard) {
          const prevInner = activeShelfCard.querySelector('.artwork-card-inner');
          gsap.set(prevInner, { opacity: 1 });
        }
        activeShelfCard = targetCard;
        const nextInner = activeShelfCard.querySelector('.artwork-card-inner');
        gsap.set(nextInner, { opacity: 0 }); // hide new active card on shelf
      }

      // Slide in new card content
      gsap.fromTo(flipCardElement, 
        { opacity: 0, x: direction * 40, rotationY: direction * 15 },
        { opacity: 1, x: 0, rotationY: 0, duration: 0.45, ease: 'power2.out' }
      );
    }
  });
}

// 7. Exhibition Timeline Scroll Synced Focus
function setupTimelineInteraction() {
  const timelineItems = document.querySelectorAll('.timeline-item');
  
  timelineItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.getAttribute('data-target');
      const card = document.querySelector(`.artwork-card[data-id="${targetId}"]`);
      
      if (card) {
        const row = card.parentElement;
        const scrollOffset = card.offsetLeft - (row.offsetWidth / 2) + (card.offsetWidth / 2);
        
        row.scrollTo({
          left: scrollOffset,
          behavior: 'smooth'
        });

        // Trigger a subtle levitation scale highlight effect
        card.classList.remove('idle-float');
        
        gsap.fromTo(card, 
          { y: 0 }, 
          { 
            y: -25, 
            duration: 0.4, 
            yoyo: true, 
            repeat: 1,
            ease: 'power2.out',
            onComplete: () => {
              card.classList.add('idle-float');
            }
          }
        );
      }
    });
  });
}
// Event Listeners for Modal
closeModalBtn.addEventListener('click', closeArtworkModal);
modalBackdrop.addEventListener('click', closeArtworkModal);
prevBtn.addEventListener('click', () => navigateModal(-1));
nextBtn.addEventListener('click', () => navigateModal(1));
// Keyboard Listeners
window.addEventListener('keydown', (e) => {
  if (galleryModal.classList.contains('active')) {
    if (e.key === 'Escape') {
      closeArtworkModal();
    } else if (e.key === 'ArrowRight') {
      navigateModal(1);
    } else if (e.key === 'ArrowLeft') {
      navigateModal(-1);
    } else if (e.key === ' ' || e.key === 'Enter') {
      if (document.activeElement !== closeModalBtn) {
        e.preventDefault();
        flipCardInner.classList.toggle('flipped');
      }
    }
  }
});

// Run Initialization
initializeGallery();
