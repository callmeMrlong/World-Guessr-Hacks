(() => {
  const map = document.querySelector('.leaflet-container');
  if (!map) return console.error("No Leaflet map found");

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
    transform: 'translate(-50%, -50%)'
  });

  map.appendChild(dot);

  function update() {
    dot.style.left = (map.clientWidth / 2) + 'px';
    dot.style.top = (map.clientHeight / 2) + 'px';
  }

  update();
  window.addEventListener('resize', update);
  new ResizeObserver(update).observe(map);
})();