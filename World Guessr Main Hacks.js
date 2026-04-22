let display;
let updateInterval;

let mapIframe = null;
let isActive = false;
let mapActive = false;

let currentCounty = '';
let currentCountry = '';
let currentLat = 0;
let currentLng = 0;
let mapZoom = 8;

// ---------------- DISPLAY ----------------

function createDisplay() {
  display = document.createElement('div');
  Object.assign(display.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(255,255,255,0.8)',
    color: 'black',
    padding: '10px 20px',
    borderRadius: '5px',
    fontSize: '16px',
    zIndex: 9999,
    fontFamily: 'Arial, sans-serif',
    whiteSpace: 'pre-line'
  });

  display.textContent = 'Loading location...';
  document.body.appendChild(display);
}

function removeDisplay() {
  if (display) display.remove();
  display = null;

  if (updateInterval) clearInterval(updateInterval);
  updateInterval = null;
}

// ---------------- MAP ----------------

function createMapIframe() {
  if (mapIframe) return;

  mapIframe = document.createElement('iframe');
  Object.assign(mapIframe.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '400px',
    height: '300px',
    border: '3px solid #333',
    borderRadius: '10px',
    zIndex: 10000,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
  });

  updateMapSrc();
  document.body.appendChild(mapIframe);
  mapActive = true;
}

function removeMapIframe() {
  if (mapIframe) mapIframe.remove();
  mapIframe = null;
  mapActive = false;
}

function updateMapSrc() {
  if (!mapIframe) return;

  const bbox = 0.5 / Math.pow(2, mapZoom - 8);

  const url =
    'https://www.openstreetmap.org/export/embed.html?bbox=' +
    (currentLng - bbox) + ',' +
    (currentLat - bbox) + ',' +
    (currentLng + bbox) + ',' +
    (currentLat + bbox) +
    '&layer=mapnik&marker=' +
    currentLat + ',' +
    currentLng;

  mapIframe.src = url;
}

// ---------------- LOCATION ----------------

function updateLocation() {
  const iframe =
    document.getElementById('streetview') ||
    document.querySelector('iframe.streetview');

  if (!iframe) {
    if (display) display.textContent = 'No iframe found';
    return;
  }

  const u = iframe.src;
  const locMatch = u.match(/location=([^,&]+),([^&]+)/);

  if (!locMatch) {
    if (display) display.textContent = 'No coords found';
    return;
  }

  const answerLat = parseFloat(locMatch[1]);
  const answerLng = parseFloat(locMatch[2]);

  currentLat = answerLat;
  currentLng = answerLng;

  if (mapActive) updateMapSrc();

  if (display) {
    display.textContent = `Lat: ${answerLat}\nLng: ${answerLng}`;
  }
}

// ---------------- KEY CONTROLS ----------------

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  // START / STOP tracking (E)
  if (key === 'e') {
    if (!isActive) {
      isActive = true;
      createDisplay();
      updateLocation();
      updateInterval = setInterval(updateLocation, 2000);
    }
  }

  // TOGGLE MAP (W)
  if (key === 'w') {
    if (!mapActive) {
      if (currentLat === 0 && currentLng === 0) updateLocation();
      mapZoom = 8;
      setTimeout(createMapIframe, 100);
    } else {
      removeMapIframe();
    }
  }

  // ZOOM IN (Q)
  if (key === 'q' && mapActive && mapZoom < 20) {
    mapZoom++;
    updateMapSrc();
  }

  // ZOOM OUT (A)
  if (key === 'a' && mapActive && mapZoom > 1) {
    mapZoom--;
    updateMapSrc();
  }

  // 🔥 YOUR CUSTOM HOOK (S)
  if (key === 's') {
    console.log("S pressed:", currentLat, currentLng);

    // plug your function here:
    if (typeof window.guessLocation === "function") {
      window.guessLocation(currentLat, currentLng);
    }
  }
});

// STOP tracking on keyup E
document.addEventListener('keyup', (e) => {
  if (e.key.toLowerCase() === 'e' && isActive) {
    isActive = false;
    removeDisplay();
  }
});
