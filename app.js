// --- DOM Elements ---
const canvas = document.getElementById('garden-canvas');
const btnDraw = document.getElementById('btn-draw');
const btnInspect = document.getElementById('btn-inspect');
const modal = document.getElementById('plant-modal');
const closeModalBtn = document.getElementById('close-modal');
const form = document.getElementById('plant-form');
const photoUploadBtn = document.getElementById('upload-photo-btn');
const photoInput = document.getElementById('photo-input');
const photoGallery = document.getElementById('photo-gallery');

// Form Inputs
const bedIdInput = document.getElementById('bed-id');
const cropNameInput = document.getElementById('crop-name');
const seedBrandInput = document.getElementById('seed-brand');
const plantDateInput = document.getElementById('plant-date');

// --- State Management ---
// Load existing beds from LocalStorage or start fresh
let beds = JSON.parse(localStorage.getItem('gardenBeds')) || [];
let currentMode = 'draw'; // 'draw' or 'inspect'

// --- Initialization ---
function init() {
    renderBeds();
    setupEventListeners();
}

// --- Event Listeners ---
function setupEventListeners() {
    // Mode toggles
    btnDraw.addEventListener('click', () => setMode('draw'));
    btnInspect.addEventListener('click', () => setMode('inspect'));

    // Canvas click to draw
    canvas.addEventListener('click', handleCanvasClick);

    // Modal controls
    closeModalBtn.addEventListener('click', closeModal);
    form.addEventListener('submit', handleFormSubmit);

    // Photo upload triggers
    photoUploadBtn.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', handlePhotoUpload);
}

// --- Core Logic ---

function setMode(mode) {
    currentMode = mode;
    
    // Update button styling
    if (mode === 'draw') {
        btnDraw.classList.add('active');
        btnInspect.classList.remove('active');
        canvas.classList.add('draw-mode');
        canvas.classList.remove('inspect-mode');
    } else {
        btnInspect.classList.add('active');
        btnDraw.classList.remove('active');
        canvas.classList.add('inspect-mode');
        canvas.classList.remove('draw-mode');
    }
}

function handleCanvasClick(e) {
    if (currentMode !== 'draw') return;
    
    // Prevent drawing a new bed if we clicked directly on an existing bed
    if (e.target !== canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    // Calculate click position relative to canvas and snap to 40px grid
    const x = Math.floor((e.clientX - rect.left) / 40) * 40;
    const y = Math.floor((e.clientY - rect.top) / 40) * 40;

    const newBed = {
        id: 'bed_' + Date.now(),
        x: x,
        y: y,
        width: 80, // Default 2x2 grid squares
        height: 80,
        cropName: '',
        seedBrand: '',
        plantDate: '',
        photos: []
    };

    beds.push(newBed);
    saveData();
    renderBeds();
}

function handleBedClick(bed, element) {
    if (currentMode !== 'inspect') return;
    openModal(bed);
}

function renderBeds() {
    // Clear canvas
    canvas.innerHTML = '';

    beds.forEach(bed => {
        const bedEl = document.createElement('div');
        bedEl.classList.add('bed');
        
        // Add styling if the bed has a plant assigned
        if (bed.cropName) {
            bedEl.classList.add('planted');
            bedEl.innerHTML = `<span>${bed.cropName}</span>`;
        } else {
            bedEl.innerHTML = `<i class="ph ph-leaf"></i>`;
        }

        // Apply size and position
        bedEl.style.left = `${bed.x}px`;
        bedEl.style.top = `${bed.y}px`;
        bedEl.style.width = `${bed.width}px`;
        bedEl.style.height = `${bed.height}px`;

        // Listen for clicks in inspect mode
        bedEl.addEventListener('click', () => handleBedClick(bed, bedEl));

        canvas.appendChild(bedEl);
    });
}

// --- Modal & Form Logic ---

function openModal(bed) {
    // Populate form data
    bedIdInput.value = bed.id;
    cropNameInput.value = bed.cropName || '';
    seedBrandInput.value = bed.seedBrand || '';
    plantDateInput.value = bed.plantDate || '';
    
    renderPhotoGallery(bed.photos || []);

    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex'); // Assuming your CSS uses display:flex for the active modal
}

function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    form.reset();
    photoInput.value = '';
    photoGallery.innerHTML = '';
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const idToUpdate = bedIdInput.value;
    const bedIndex = beds.findIndex(b => b.id === idToUpdate);
    
    if (bedIndex !== -1) {
        beds[bedIndex].cropName = cropNameInput.value;
        beds[bedIndex].seedBrand = seedBrandInput.value;
        beds[bedIndex].plantDate = plantDateInput.value;
        
        // Photos are handled immediately on upload, so no need to save them here
        saveData();
        renderBeds();
        closeModal();
    }
}

// --- Photo Upload Logic ---

function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Use FileReader to convert image to base64 Data URL for local storage
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const base64Image = event.target.result;
        const currentBedId = bedIdInput.value;
        
        // Find the active bed and add the photo
        const bed = beds.find(b => b.id === currentBedId);
        if (bed) {
            if (!bed.photos) bed.photos = [];
            bed.photos.push(base64Image);
            
            saveData();
            renderPhotoGallery(bed.photos);
        }
    };
    
    reader.readAsDataURL(file);
}

function renderPhotoGallery(photos) {
    photoGallery.innerHTML = '';
    
    photos.forEach(photoSrc => {
        const img = document.createElement('img');
        img.src = photoSrc;
        img.classList.add('gallery-img');
        photoGallery.appendChild(img);
    });
}

// --- Data Persistence ---
function saveData() {
    localStorage.setItem('gardenBeds', JSON.stringify(beds));
}

// Boot up the app
init();

// --- Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registered successfully:', registration.scope);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    });
}