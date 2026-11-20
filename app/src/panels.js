// Panel geometry for Sunset Panels.
// Six angled slices, written as polygons in percent coordinates (0-100 on
// both axes). The editor uses them as CSS clip-paths and the exporter uses
// the exact same numbers on canvas, so the PNG matches the live preview.
// The small gaps between polygons are deliberate: the dark stage shows
// through as the poster's dividing cuts.

export const PANEL_POLYGONS = [
  [[0, 0], [57, 0], [47, 37], [0, 42]],
  [[59, 0], [100, 0], [100, 29], [49, 37]],
  [[0, 44], [46, 39], [41, 67], [0, 71]],
  [[48, 39], [100, 31], [100, 65], [43, 67]],
  [[0, 73], [40, 69], [51, 100], [0, 100]],
  [[42, 69], [100, 67], [100, 100], [53, 100]],
];

export const PANEL_NAMES = [
  'Top left',
  'Top right',
  'Middle left',
  'Middle right',
  'Bottom left',
  'Bottom right',
];

export function polygonToClipPath(polygon) {
  return 'polygon(' + polygon.map(([x, y]) => `${x}% ${y}%`).join(', ') + ')';
}

export function tracePolygonPath(ctx, polygon, width, height) {
  ctx.beginPath();
  polygon.forEach(([x, y], index) => {
    const px = (x / 100) * width;
    const py = (y / 100) * height;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
}

export function makePanelState(src) {
  return {
    src: src || '',
    image: null,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  };
}

export function makeInitialPanels(defaultSrc) {
  return PANEL_POLYGONS.map(() => makePanelState(defaultSrc));
}
