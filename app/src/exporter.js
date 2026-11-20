// Canvas exporter for Sunset Panels.
// Draws the cover at a true export size (1080x1080, 1080x1350 or
// 1920x1080) using the same panel polygons, photo transforms, sunset
// grade and caption styling as the on-screen preview, then downloads
// the result as a PNG. All drawing happens locally on a canvas.

import { PANEL_POLYGONS, tracePolygonPath } from './panels.js';

export const EXPORT_SIZES = {
  '1080x1080': { width: 1080, height: 1080, label: 'Square' },
  '1080x1350': { width: 1080, height: 1350, label: 'Portrait' },
  '1920x1080': { width: 1920, height: 1080, label: 'Wide' },
};

function drawPhotoCover(ctx, image, width, height, panel) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * panel.zoom;
  const drawnWidth = image.naturalWidth * scale;
  const drawnHeight = image.naturalHeight * scale;
  const x = (width - drawnWidth) / 2 + panel.offsetX;
  const y = (height - drawnHeight) / 2 + panel.offsetY;
  ctx.drawImage(image, x, y, drawnWidth, drawnHeight);
}

function paintPanelGrade(ctx, width, height, intensity) {
  if (intensity <= 0) return;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, `rgba(255, 79, 163, ${0.38 * intensity})`);
  gradient.addColorStop(0.45, `rgba(255, 138, 61, ${0.18 * intensity})`);
  gradient.addColorStop(1, `rgba(25, 211, 197, ${0.34 * intensity})`);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(255, 120, 60, ${0.10 * intensity})`;
  ctx.fillRect(0, 0, width, height);
}

function boostPhotoColours(ctx, width, height) {
  // A gentle warm wash that stands in for the CSS saturate/contrast
  // filter the preview applies to each photo.
  ctx.fillStyle = 'rgba(255, 90, 120, 0.06)';
  ctx.fillRect(0, 0, width, height);
}

export function drawCover(ctx, width, height, state) {
  ctx.save();
  ctx.fillStyle = '#0d0518';
  ctx.fillRect(0, 0, width, height);

  state.panels.forEach((panel, index) => {
    ctx.save();
    tracePolygonPath(ctx, PANEL_POLYGONS[index], width, height);
    ctx.clip();
    if (panel.image && panel.image.complete && panel.image.naturalWidth > 0) {
      // Scale editor offsets (preview pixels) up to export pixels.
      const previewScale = width / state.previewWidth;
      const scaledPanel = {
        zoom: panel.zoom,
        offsetX: panel.offsetX * previewScale,
        offsetY: panel.offsetY * previewScale,
      };
      drawPhotoCover(ctx, panel.image, width, height, scaledPanel);
      boostPhotoColours(ctx, width, height);
    } else {
      ctx.fillStyle = index % 2 === 0 ? '#3a1454' : '#57184a';
      ctx.fillRect(0, 0, width, height);
    }
    paintPanelGrade(ctx, width, height, state.grade);
    ctx.restore();

    ctx.save();
    tracePolygonPath(ctx, PANEL_POLYGONS[index], width, height);
    ctx.lineWidth = Math.max(3, width * 0.004);
    ctx.strokeStyle = '#0d0518';
    ctx.stroke();
    ctx.restore();
  });

  paintOverallGrade(ctx, width, height, state.grade);
  drawCaption(ctx, width, height, state);
  ctx.restore();
}

function paintOverallGrade(ctx, width, height, intensity) {
  if (intensity <= 0) return;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, `rgba(255, 60, 140, ${0.22 * intensity})`);
  gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, `rgba(255, 110, 40, ${0.30 * intensity})`);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';

  const vignette = ctx.createRadialGradient(
    width / 2, height * 0.42, Math.min(width, height) * 0.35,
    width / 2, height * 0.5, Math.max(width, height) * 0.78,
  );
  vignette.addColorStop(0, 'rgba(10, 2, 20, 0)');
  vignette.addColorStop(1, 'rgba(10, 2, 20, 0.48)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function fitCaptionFont(ctx, caption, baseSize, maxWidth) {
  let size = baseSize;
  const family = '"Arial Black", Impact, "Franklin Gothic Heavy", sans-serif';
  while (size > 28) {
    ctx.font = `900 ${size}px ${family}`;
    if (ctx.measureText(caption).width <= maxWidth) break;
    size -= 6;
  }
  return size;
}

function drawCaption(ctx, width, height, state) {
  const caption = (state.caption || '').trim().toUpperCase();
  const unit = Math.min(width, height);
  const scale = state.captionScale || 1;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const kickerSize = Math.round(unit * 0.026 * scale);
  ctx.font = `900 ${kickerSize}px "Arial Black", Impact, sans-serif`;
  ctx.fillStyle = '#19d3c5';
  ctx.shadowColor = '#160a24';
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  ctx.shadowBlur = 0;
  const kickerY = height - unit * 0.205 * scale - unit * 0.02;
  ctx.fillText('S U N S E T   P A N E L S   P R E S E N T S', width / 2, kickerY);

  if (caption) {
    const baseSize = unit * 0.118 * scale;
    const fontSize = fitCaptionFont(ctx, caption, baseSize, width * 0.92);
    ctx.font = `900 ${fontSize}px "Arial Black", Impact, "Franklin Gothic Heavy", sans-serif`;
    const captionY = height - unit * 0.085 * scale;
    ctx.lineWidth = Math.max(6, fontSize * 0.14);
    ctx.strokeStyle = '#160a24';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255, 79, 163, 0.65)';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = unit * 0.045;
    ctx.strokeText(caption, width / 2, captionY);
    ctx.shadowColor = '#160a24';
    ctx.shadowOffsetX = fontSize * 0.07;
    ctx.shadowOffsetY = fontSize * 0.07;
    ctx.shadowBlur = 0;
    const textGradient = ctx.createLinearGradient(0, captionY - fontSize, 0, captionY);
    textGradient.addColorStop(0, '#ffffff');
    textGradient.addColorStop(0.55, '#fff6ec');
    textGradient.addColorStop(1, '#ffd23d');
    ctx.fillStyle = textGradient;
    ctx.fillText(caption, width / 2, captionY);

    const ruleWidth = width * 0.46;
    const ruleHeight = Math.max(6, unit * 0.014);
    const ruleX = (width - ruleWidth) / 2;
    const ruleY = captionY + unit * 0.028;
    const ruleGradient = ctx.createLinearGradient(ruleX, 0, ruleX + ruleWidth, 0);
    ruleGradient.addColorStop(0, '#19d3c5');
    ruleGradient.addColorStop(0.5, '#ffd23d');
    ruleGradient.addColorStop(1, '#ff4fa3');
    ctx.fillStyle = ruleGradient;
    ctx.shadowColor = 'transparent';
    ctx.fillRect(ruleX, ruleY, ruleWidth, ruleHeight);
  }
  ctx.restore();
}

export function exportCoverPng(state, sizeKey) {
  const size = EXPORT_SIZES[sizeKey] || EXPORT_SIZES['1080x1080'];
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, size.width, size.height, state);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
