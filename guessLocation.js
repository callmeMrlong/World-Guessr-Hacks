function guessLocation(lat, lng) {
  const el = document.querySelector('.leaflet-container');
  if (!el) return console.error("No map container");

  const rect = el.getBoundingClientRect();

  const tile = document.querySelector('.leaflet-tile');
  const zoom = parseInt(tile?.src.match(/z=(\d+)/)?.[1] || 2);

  const scale = 256 * Math.pow(2, zoom);

  // Mercator projection (Leaflet-style)
  function project(lat, lng) {
    const x = (lng + 180) / 360 * scale;

    const latRad = lat * Math.PI / 180;
    const y = (1 - Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / Math.PI) / 2 * scale;

    return { x, y };
  }

  const p = project(lat, lng);

  // 🔥 KEY FIX: normalize around center of world
  const worldCenter = scale / 2;

  const screenX = (p.x - worldCenter) + rect.width / 2;
  const screenY = (p.y - worldCenter) + rect.height / 2;

  const clientX = rect.left + screenX;
  const clientY = rect.top + screenY;

  const target = document.elementFromPoint(clientX, clientY);
  if (!target) {
    console.warn("Click outside map:", clientX, clientY);
    return;
  }

  function fire(type, cls) {
    target.dispatchEvent(new cls(type, {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
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

  console.log(`✅ ${lat}, ${lng} at zoom ${zoom}`);
}