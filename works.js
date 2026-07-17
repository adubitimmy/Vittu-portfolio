import { gsap } from 'gsap';
import artworksData from './artworks.json';

// DOM Elements
const allWorksGrid = document.getElementById('all-works-grid');
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

const menuTrigger = document.getElementById('gallery-menu-trigger');
const fullMenu = document.getElementById('gallery-full-menu');
const closeMenuBtn = document.getElementById('close-gallery-menu');

// State
let currentArtworkIndex = 0;
let activeGridCard = null;

// 1. Initialize Grid
function initializeGrid() {
  artworksData.forEach((artwork, index) => {
    const card = createGridCard(artwork, index);
    allWorksGrid.appendChild(card);
  });
}

function createGridCard(artwork, index) {
  const card = document.createElement('div');
  card.className = 'grid-card';
  card.setAttribute('data-id', artwork.id);
  card.setAttribute('data-index', index);
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-label', `${artwork.title}. ${artwork.medium}, ${artwork.year}.`);

  card.innerHTML = `
    <div class="grid-card-inner">
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
  `;

  // Click & keyboard entry listeners
  card.addEventListener('click', () => {
    openArtworkModal(index, card);
  });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      openArtworkModal(index, card);
    }
  });

  return card;
}

// 2. GSAP Flight Modal Animation from Grid
function openArtworkModal(index, cardElement) {
  currentArtworkIndex = index;
  activeGridCard = cardElement;
  const artwork = artworksData[index];

  // Set details and reset flip card to its front face
  updateModalContent(artwork);
  flipCardInner.classList.remove('flipped');

  const cardRect = cardElement.getBoundingClientRect();
  const innerCard = cardElement.querySelector('.grid-card-inner');
  const modalWrapper = galleryModal.querySelector('.modal-wrapper');

  // Hide grid card inner
  gsap.set(innerCard, { opacity: 0 });

  // Open modal portal
  galleryModal.classList.add('active');
  galleryModal.setAttribute('aria-hidden', 'false');

  // Calculate coordinates delta
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

// 3. Modal Click-to-Flip handler
flipCardElement.addEventListener('click', (e) => {
  if (e.target.closest('button') || e.target.closest('a')) return;
  flipCardInner.classList.toggle('flipped');
});

// Close Modal with Reverse Spin-back
function closeArtworkModal() {
  if (!activeGridCard) return;

  const performCloseFlight = () => {
    const cardRect = activeGridCard.getBoundingClientRect();
    const innerCard = activeGridCard.querySelector('.grid-card-inner');
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
        
        // Show grid card again
        gsap.set(innerCard, { opacity: 1 });
        activeGridCard.focus();
        activeGridCard = null;
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

// 4. Modal Navigation Controls (Next/Prev)
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
      
      // Sync active grid card reference
      const targetCard = document.querySelector(`.grid-card[data-index="${artwork.id}"]`) || 
                         document.querySelector(`.grid-card[data-id="${artwork.id}"]`);
      if (targetCard) {
        if (activeGridCard) {
          const prevInner = activeGridCard.querySelector('.grid-card-inner');
          gsap.set(prevInner, { opacity: 1 });
        }
        activeGridCard = targetCard;
        const nextInner = activeGridCard.querySelector('.grid-card-inner');
        gsap.set(nextInner, { opacity: 0 }); // hide new active card on grid
      }

      // Slide in new card content
      gsap.fromTo(flipCardElement, 
        { opacity: 0, x: direction * 40, rotationY: direction * 15 },
        { opacity: 1, x: 0, rotationY: 0, duration: 0.45, ease: 'power2.out' }
      );
    }
  });
}

// 5. Fullscreen Menu Overlay Logic
function openMenu() {
  fullMenu.classList.add('active');
  gsap.fromTo('.menu-link', 
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
  );
}

function closeMenu() {
  fullMenu.classList.remove('active');
}

// Event Listeners
closeModalBtn.addEventListener('click', closeArtworkModal);
modalBackdrop.addEventListener('click', closeArtworkModal);
prevBtn.addEventListener('click', () => navigateModal(-1));
nextBtn.addEventListener('click', () => navigateModal(1));

menuTrigger.addEventListener('click', openMenu);
closeMenuBtn.addEventListener('click', closeMenu);

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
initializeGrid();
