javascript:(function(){

/* ---------- CONFIG ---------- */
const START_LAT = 30.0;
const START_LNG = 0.0;

/* ---------- MAP ---------- */
function getMap(){
  return document.querySelector('.leaflet-container');
}

/* ---------- NOTIFICATION ---------- */
function showNotification(msg, duration=3000){
  const existing = document.getElementById('gg-notif');
  if(existing) existing.remove();

  const notif = document.createElement('div');
  notif.id = 'gg-notif';
  Object.assign(notif.style, {
    position: 'fixed',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(220,50,50,0.92)',
    color: '#fff',
    padding: '10px 22px',
    borderRadius: '8px',
    zIndex: 999999,
    fontFamily: 'Arial',
    fontSize: '15px',
    fontWeight: 'bold',
    boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
    pointerEvents: 'none',
    transition: 'opacity 0.4s'
  });
  notif.textContent = msg;
  document.body.appendChild(notif);

  setTimeout(() => {
    notif.style.opacity = '0';
    setTimeout(() => notif.remove(), 400);
  }, duration);
}

/* ---------- CLICK SYSTEM ---------- */
function guessLocation(lat, lng){
  const mapEl = getMap();
  if(!mapEl){
    showNotification("❌ Map not found!");
    return;
  }

  const rect = mapEl.getBoundingClientRect();

  const tile = document.querySelector('.leaflet-tile');
  const zoom = parseInt(tile?.src.match(/z=(\d+)/)?.[1] || 2);

  const scale = 256 * Math.pow(2, zoom);

  function project(lat, lng){
    const x = (lng + 180) / 360 * scale;
    const latRad = lat * Math.PI / 180;
    const y = (1 - Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / Math.PI) / 2 * scale;
    return { x, y };
  }

  const origin = project(START_LAT, START_LNG);
  const p = project(lat, lng);

  const screenX = (p.x - origin.x) + rect.width / 2;
  const screenY = (p.y - origin.y) + rect.height / 2;

  const clientX = rect.left + screenX;
  const clientY = rect.top + screenY;

  /* ---------- OUT OF BOUNDS CHECK ---------- */
  if(clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom){
    showNotification("⚠️ Coords out of map bounds! Zoom out or pan the map.", 3500);
    return;
  }

  const clampedX = Math.max(rect.left + 2, Math.min(clientX, rect.right - 2));
  const clampedY = Math.max(rect.top + 2, Math.min(clientY, rect.bottom - 2));

  const target = document.elementFromPoint(clampedX, clampedY);
  if(!target){
    showNotification("⚠️ Click target not found on map.", 3000);
    return;
  }

  function fire(type, cls){
    target.dispatchEvent(new cls(type, {
      bubbles: true,
      cancelable: true,
      clientX: clampedX,
      clientY: clampedY,
      view: window
    }));
  }

  fire('pointerdown', PointerEvent);
  fire('mousedown', MouseEvent);

  setTimeout(() => {
    fire('pointerup', PointerEvent);
    fire('mouseup', MouseEvent);
    fire('click', MouseEvent);
  }, 10);

  console.log("✅ Click:", lat, lng);
}

/* ---------- RED DOT ---------- */
(function(){
  const map = getMap();
  if(!map) return;

  const dot = document.createElement('div');
  Object.assign(dot.style, {
    position: 'absolute',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: 'red',
    opacity: '0.5',
    pointerEvents: 'none',
    zIndex: 99999,
    transform: 'translate(-50%,-50%)'
  });

  map.appendChild(dot);

  function update(){
    dot.style.left = (map.clientWidth / 2) + 'px';
    dot.style.top = (map.clientHeight / 2) + 'px';
  }

  update();
  window.addEventListener('resize', update);
})();

/* ---------- STATE ---------- */
let display, interval;
let active = false;
let lat = START_LAT;
let lng = START_LNG;

/* ---------- REVERSE GEOCODE ---------- */
async function getCityCountry(lat, lng){
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const data = await res.json();
    const addr = data.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || '';
    const country = addr.country || '';
    return [city, country].filter(Boolean).join(', ') || 'Unknown location';
  } catch(e){
    return 'Location lookup failed';
  }
}

/* ---------- STREET VIEW IFRAME ---------- */
function getStreetViewIframe(){
  const iframes = document.querySelectorAll('iframe');
  for(const f of iframes){
    if(f.src && f.src.includes('location=')) return f;
  }
  return null;
}

/* ---------- UPDATE LOCATION ---------- */
async function updateLocation(){
  const iframe = getStreetViewIframe();
  if(!iframe){
    if(display) display.textContent = "No Street View iframe found";
    return;
  }

  const m = iframe.src.match(/location=([^,&]+),([^&]+)/);
  if(!m){
    if(display) display.textContent = "No coords found";
    return;
  }

  lat = parseFloat(m[1]);
  lng = parseFloat(m[2]);

  const place = await getCityCountry(lat, lng);

  if(display){
    display.textContent = `📍 ${place}\nLat: ${lat}\nLng: ${lng}`;
  }
}

/* ---------- DISPLAY ---------- */
function createDisplay(){
  display = document.createElement('div');
  Object.assign(display.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(255,255,255,0.88)',
    padding: '10px 18px',
    zIndex: 9999,
    fontFamily: 'Arial',
    fontSize: '14px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    whiteSpace: 'pre-line',
    textAlign: 'center'
  });
  display.textContent = 'Starting...';
  document.body.appendChild(display);
}

function removeDisplay(){
  display && display.remove();
  clearInterval(interval);
}

/* ---------- CONTROLS ---------- */
document.addEventListener('keydown', async e => {
  const k = e.key.toLowerCase();

  /* T = toggle tracking display */
  if(k === 't'){
    if(!active){
      active = true;
      createDisplay();
      await updateLocation();
      interval = setInterval(updateLocation, 1000);
    } else {
      active = false;
      removeDisplay();
    }
  }

  /* R = guess at current coords (instant, uses last known coords) */
  if(k === 'r'){
    guessLocation(lat, lng);
  }

  /* Q / A = zoom stubs */
  if(k === 'q') zoomMap(1);
  if(k === 'a') zoomMap(-1);
});

/* ---------- OPTIONAL ZOOM HOOK (safe stub) ---------- */
function zoomMap(dir){
  const tile = document.querySelector('.leaflet-tile');
  if(!tile) return;
  let zoom = parseInt(tile.src.match(/z=(\d+)/)?.[1] || 2);
  zoom = Math.max(1, Math.min(20, zoom + dir));
  console.log("Zoom request ignored (game-controlled):", zoom);
}

/* ---------- AUTO-START DISPLAY ---------- */
active = true;
createDisplay();
updateLocation();
interval = setInterval(updateLocation, 1000);

})();
