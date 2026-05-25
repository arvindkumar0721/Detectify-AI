// DOM Elements
const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas-overlay');
const ctx = canvas.getContext('2d');
const camStatus = document.getElementById('cam-status');
const modelStatus = document.getElementById('model-status');
const fpsCounter = document.getElementById('fps-counter');
const detectionList = document.getElementById('detection-list');
const loadingScreen = document.getElementById('loading-screen');

// Controls
const toggleDetectionBtn = document.getElementById('toggle-detection');
const toggleBoundsBtn = document.getElementById('toggle-bounds');

// Widgets
const widgets = {
  'person': document.getElementById('widget-person'),
  'cell phone': document.getElementById('widget-cell-phone'),
  'bottle': document.getElementById('widget-bottle'),
  'laptop': document.getElementById('widget-laptop'),
  'book': document.getElementById('widget-book'),
  'cup': document.getElementById('widget-cup'),
};

// Target Classes Priority
const targetClasses = ['person', 'cell phone', 'bottle', 'laptop', 'book', 'cup'];

// Colors for bounding boxes
const classColors = {
  'person': '#10b981',
  'cell phone': '#ef4444',
  'bottle': '#3b82f6',
  'laptop': '#8b5cf6',
  'book': '#f97316',
  'cup': '#14b8a6',
  'default': '#06b6d4'
};

// State
let model = null;
let isDetecting = true;
let showBounds = true;
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

// Debounce Tracking [className]: continuous frame count
const detectionBuffer = {};
const REQUIRED_FRAMES = 10; // Object must be present for 10 frames consecutively
const ACTIVE_THRESHOLD = 0.6; // Confidence > 60%

// Timer for Study Mode
let studyTimerInterval = null;
let studyTimeLeft = 25 * 60; // 25 mins

// Setup webcam
async function setupWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: false,
    });
    video.srcObject = stream;
    
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        // Set canvas to match video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        camStatus.textContent = 'Active';
        camStatus.className = 'value text-success';
        resolve();
      };
    });
  } catch (err) {
    camStatus.textContent = 'Denied/Error';
    camStatus.className = 'value text-warn';
    console.error('Error accessing webcam:', err);
  }
}

// Load Model
async function loadModel() {
  modelStatus.textContent = 'Loading...';
  try {
    // Wait for cocoSsd to be globally available from CDN
    const waitForCoco = () => new Promise(res => {
      const check = () => window.cocoSsd ? res() : setTimeout(check, 100);
      check();
    });
    
    await waitForCoco();
    model = await cocoSsd.load();
    
    modelStatus.textContent = 'Ready';
    modelStatus.className = 'value text-success';
    loadingScreen.classList.add('hidden');
    console.log("Model loaded.");
  } catch (err) {
    modelStatus.textContent = 'Failed';
    modelStatus.className = 'value text-warn';
    console.error('Error loading model:', err);
  }
}

// Format timer
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Widget interaction logic
function manageWidgets(activeObjects) {
  // activeObjects is a list of normalized class names that met threshold and debounce
  targetClasses.forEach(cls => {
    const el = widgets[cls];
    if (!el) return;
    
    if (activeObjects.includes(cls)) {
      el.classList.remove('hide');
      el.style.position = 'relative'; // reset abs positioning
      if (cls === 'book' && !studyTimerInterval) {
        // Start study mode timer visually
        const tEl = el.querySelector('.timer');
        studyTimerInterval = setInterval(() => {
          if (studyTimeLeft > 0) studyTimeLeft--;
          tEl.textContent = formatTime(studyTimeLeft);
        }, 1000);
      }
    } else {
      el.classList.add('hide');
      setTimeout(() => el.style.position = 'absolute', 400); // Wait for transition
      if (cls === 'book' && studyTimerInterval) {
        clearInterval(studyTimerInterval);
        studyTimerInterval = null;
      }
    }
  });
}

function updateHistoryPanel(topPredictions) {
  detectionList.innerHTML = '';
  topPredictions.forEach(pred => {
    const li = document.createElement('li');
    li.style.borderLeftColor = classColors[pred.class] || classColors['default'];
    li.innerHTML = `<span>${pred.class}</span> <span class="text-accent">${Math.round(pred.score * 100)}%</span>`;
    detectionList.appendChild(li);
  });
}

// Main detection loop
async function detectFrame() {
  if (!model || !isDetecting || video.videoWidth === 0) {
    if(isDetecting) requestAnimationFrame(detectFrame);
    return;
  }

  // Calculate FPS
  const now = performance.now();
  frameCount++;
  if (now - lastFrameTime >= 1000) {
    fps = frameCount;
    fpsCounter.textContent = fps;
    frameCount = 0;
    lastFrameTime = now;
  }

  // Detect objects
  const predictions = await model.detect(video);
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Filter valid classes and high confidence
  let validPreds = predictions.filter(p => targetClasses.includes(p.class) && p.score > ACTIVE_THRESHOLD);
  
  // Sort by confidence, take top 3
  validPreds.sort((a, b) => b.score - a.score);
  const topPreds = validPreds.slice(0, 3);
  const topClasses = topPreds.map(p => p.class);

  // Process debouncing
  const currentActive = [];
  targetClasses.forEach(cls => {
    if (topClasses.includes(cls)) {
      detectionBuffer[cls] = (detectionBuffer[cls] || 0) + 1;
    } else {
      detectionBuffer[cls] = Math.max(0, (detectionBuffer[cls] || 0) - 2); // Decay faster when gone
    }

    if (detectionBuffer[cls] >= REQUIRED_FRAMES) {
      currentActive.push(cls);
      // Clamp to prevent infinite growth
      detectionBuffer[cls] = REQUIRED_FRAMES + 5; 
    }
  });

  manageWidgets(currentActive);
  updateHistoryPanel(topPreds);

  // Draw bounds
  if (showBounds) {
    topPreds.forEach(prediction => {
      const [x, y, width, height] = prediction.bbox;
      const clsName = prediction.class;
      const color = classColors[clsName] || classColors['default'];
      const conf = Math.round(prediction.score * 100);

      // We need to mirror X coordinates because canvas is scaledX(-1) in CSS
      // So drawing on mirrored canvas flips it. Drawing X at video.width - x - width fixes it visually
      const mirrorX = canvas.width - x - width;

      // Draw Box with Neon Glow
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.strokeRect(mirrorX, y, width, height);
      
      // Draw Label Background
      ctx.fillStyle = color;
      ctx.fillRect(mirrorX, y > 20 ? y - 24 : y, width, 24);
      
      // Draw Text
      ctx.fillStyle = '#000';
      ctx.shadowBlur = 0;
      ctx.font = '16px Outfit, sans-serif';
      ctx.fontWeight = 'bold';
      ctx.fillText(`${clsName} ${conf}%`, mirrorX + 4, y > 20 ? y - 6 : y + 18);
    });
  }

  requestAnimationFrame(detectFrame);
}

// Event Listeners
toggleDetectionBtn.addEventListener('click', () => {
  isDetecting = !isDetecting;
  toggleDetectionBtn.textContent = isDetecting ? 'Pause' : 'Resume';
  toggleDetectionBtn.className = isDetecting ? 'glass-btn' : 'glass-btn text-warn';
  if (isDetecting) detectFrame(); // Restart loop
});

toggleBoundsBtn.addEventListener('click', () => {
  showBounds = !showBounds;
  toggleBoundsBtn.textContent = showBounds ? 'Hide Bounds' : 'Show Bounds';
});

// Init
async function init() {
  await setupWebcam();
  await loadModel();
  detectFrame();
}

window.addEventListener('DOMContentLoaded', init);
