// Sunset Panels editor.
// Loads the visitor's own photos locally (FileReader / object URLs only,
// nothing is uploaded), fills six angled panels with them, lets each
// panel's photo be dragged and zoomed, renders a bold poster caption
// over a Vice City sunset grade, and exports a PNG in three post sizes.
// The ?shot=cover / ?shot=editor query contract from shots.json is
// honoured at the bottom of this file for screenshots.

import { PANEL_NAMES, PANEL_POLYGONS, makeInitialPanels, polygonToClipPath } from './panels.js';
import { EXPORT_SIZES, downloadBlob, exportCoverPng } from './exporter.js';

const stageEl = document.getElementById('stage');
const panelsEl = document.getElementById('panels');
const captionTextEl = document.getElementById('captionText');
const captionInput = document.getElementById('captionInput');
const fileInput = document.getElementById('fileInput');
const panelPickerEl = document.getElementById('panelPicker');
const zoomSlider = document.getElementById('zoomSlider');
const xSlider = document.getElementById('xSlider');
const ySlider = document.getElementById('ySlider');
const gradeSlider = document.getElementById('gradeSlider');
const captionSizeSlider = document.getElementById('captionSizeSlider');
const sizePicker = document.getElementById('sizePicker');

const state = {
  panels: makeInitialPanels(''),
  selected: 0,
  fillMode: 'single',
  caption: 'Sunset Heist',
  grade: 0.55,
  captionScale: 1,
  sizeKey: '1080x1080',
  previewWidth: 760,
  loadTarget: 'all',
};

const panelEls = [];

function buildPanelElements() {
  state.panels.forEach((panel, index) => {
    const wrap = document.createElement('div');
    wrap.className = 'panel';
    wrap.style.clipPath = polygonToClipPath(PANEL_POLYGONS[index]);
    wrap.dataset.index = String(index);

    const img = document.createElement('img');
    img.className = 'photo';
    img.alt = PANEL_NAMES[index] + ' photo';
    img.draggable = false;

    const grade = document.createElement('div');
    grade.className = 'panel-grade';

    const badge = document.createElement('span');
    badge.className = 'panel-num';
    badge.textContent = String(index + 1);

    wrap.appendChild(img);
    wrap.appendChild(grade);
    wrap.appendChild(badge);
    panelsEl.appendChild(wrap);
    panelEls.push({ wrap, img });
    attachDragHandlers(wrap, index);
  });
}

function buildPanelPicker() {
  state.panels.forEach((_, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(index + 1);
    button.title = PANEL_NAMES[index];
    button.addEventListener('click', () => selectPanel(index));
    panelPickerEl.appendChild(button);
  });
}

function selectPanel(index) {
  state.selected = index;
  panelEls.forEach(({ wrap }, i) => wrap.classList.toggle('selected', i === index));
  [...panelPickerEl.children].forEach((button, i) => {
    button.classList.toggle('selected', i === index);
  });
  syncSliders();
}

function syncSliders() {
  const panel = state.panels[state.selected];
  zoomSlider.value = String(panel.zoom);
  xSlider.value = String(Math.round(panel.offsetX));
  ySlider.value = String(Math.round(panel.offsetY));
  document.getElementById('zoomValue').textContent = panel.zoom.toFixed(2) + '×';
  document.getElementById('xValue').textContent = String(Math.round(panel.offsetX));
  document.getElementById('yValue').textContent = String(Math.round(panel.offsetY));
}

function renderPanel(index) {
  const panel = state.panels[index];
  const { img } = panelEls[index];
  if (panel.src && img.getAttribute('src') !== panel.src) img.src = panel.src;
  img.style.transform =
    `translate(${panel.offsetX}px, ${panel.offsetY}px) scale(${panel.zoom})`;
  const anyPhoto = state.panels.some((p) => p.src);
  stageEl.classList.toggle('has-photo', anyPhoto);
}

function renderAllPanels() {
  state.panels.forEach((_, index) => renderPanel(index));
  state.previewWidth = stageEl.clientWidth || 760;
}

function setPanelPhoto(index, src) {
  const panel = state.panels[index];
  panel.src = src;
  panel.image = new Image();
  panel.image.src = src;
  renderPanel(index);
}

function applyPhotoToMode(srcList) {
  if (state.fillMode === 'single' || state.loadTarget === 'all') {
    state.panels.forEach((_, index) => setPanelPhoto(index, srcList[0]));
    return;
  }
  if (srcList.length > 1) {
    srcList.slice(0, state.panels.length).forEach((src, index) => setPanelPhoto(index, src));
  } else {
    setPanelPhoto(state.selected, srcList[0]);
  }
}

function readFilesAsDataUrls(files) {
  return Promise.all(
    [...files].map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(file);
        }),
    ),
  );
}

function attachDragHandlers(wrap, index) {
  let dragging = null;
  wrap.addEventListener('pointerdown', (event) => {
    selectPanel(index);
    dragging = { x: event.clientX, y: event.clientY };
    wrap.setPointerCapture(event.pointerId);
  });
  wrap.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const panel = state.panels[index];
    panel.offsetX += event.clientX - dragging.x;
    panel.offsetY += event.clientY - dragging.y;
    dragging = { x: event.clientX, y: event.clientY };
    renderPanel(index);
    syncSliders();
  });
  const stop = () => { dragging = null; };
  wrap.addEventListener('pointerup', stop);
  wrap.addEventListener('pointercancel', stop);
  wrap.addEventListener('wheel', (event) => {
    event.preventDefault();
    const panel = state.panels[index];
    const step = event.deltaY < 0 ? 0.06 : -0.06;
    panel.zoom = Math.min(3, Math.max(1, panel.zoom + step));
    renderPanel(index);
    if (state.selected === index) syncSliders();
  }, { passive: false });
}

function setCaption(value) {
  state.caption = value;
  captionTextEl.textContent = value || 'Your Caption';
  if (captionInput.value !== value) captionInput.value = value;
}

function setGrade(percent) {
  state.grade = percent / 100;
  document.documentElement.style.setProperty('--grade-opacity', String(state.grade));
  document.getElementById('gradeValue').textContent = `${percent}%`;
}

function setCaptionScale(percent) {
  state.captionScale = percent / 100;
  document.documentElement.style.setProperty('--caption-scale', String(state.captionScale));
  document.getElementById('captionSizeValue').textContent = `${percent}%`;
}

function setSize(sizeKey) {
  if (!EXPORT_SIZES[sizeKey]) return;
  state.sizeKey = sizeKey;
  stageEl.dataset.aspect = sizeKey;
  if (sizePicker.value !== sizeKey) sizePicker.value = sizeKey;
  requestAnimationFrame(renderAllPanels);
}

async function doExport() {
  await Promise.all(
    state.panels.map(
      (panel) =>
        new Promise((resolve) => {
          if (!panel.image || panel.image.complete) resolve();
          else {
            panel.image.onload = () => resolve();
            panel.image.onerror = () => resolve();
          }
        }),
    ),
  );
  state.previewWidth = stageEl.clientWidth || 760;
  const blob = await exportCoverPng(state, state.sizeKey);
  if (blob) downloadBlob(blob, `sunset-panels-${state.sizeKey}.png`);
}

function wireControls() {
  document.getElementById('loadAllButton').addEventListener('click', () => {
    state.loadTarget = 'all';
    fileInput.click();
  });
  document.getElementById('loadSelectedButton').addEventListener('click', () => {
    state.loadTarget = 'selected';
    fileInput.click();
  });
  fileInput.addEventListener('change', async () => {
    if (!fileInput.files || fileInput.files.length === 0) return;
    const urls = await readFilesAsDataUrls(fileInput.files);
    applyPhotoToMode(urls);
    fileInput.value = '';
  });
  document.querySelectorAll('input[name="fillMode"]').forEach((radio) => {
    radio.addEventListener('change', () => { state.fillMode = radio.value; });
  });
  zoomSlider.addEventListener('input', () => {
    state.panels[state.selected].zoom = Number(zoomSlider.value);
    renderPanel(state.selected);
    document.getElementById('zoomValue').textContent = Number(zoomSlider.value).toFixed(2) + '×';
  });
  xSlider.addEventListener('input', () => {
    state.panels[state.selected].offsetX = Number(xSlider.value);
    renderPanel(state.selected);
    document.getElementById('xValue').textContent = xSlider.value;
  });
  ySlider.addEventListener('input', () => {
    state.panels[state.selected].offsetY = Number(ySlider.value);
    renderPanel(state.selected);
    document.getElementById('yValue').textContent = ySlider.value;
  });
  document.getElementById('resetPanelButton').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    panel.zoom = 1; panel.offsetX = 0; panel.offsetY = 0;
    renderPanel(state.selected);
    syncSliders();
  });
  captionInput.addEventListener('input', () => setCaption(captionInput.value));
  gradeSlider.addEventListener('input', () => setGrade(Number(gradeSlider.value)));
  captionSizeSlider.addEventListener('input', () => setCaptionScale(Number(captionSizeSlider.value)));
  sizePicker.addEventListener('change', () => setSize(sizePicker.value));
  document.getElementById('exportButton').addEventListener('click', doExport);
  document.getElementById('exportButtonSide').addEventListener('click', doExport);
  window.addEventListener('resize', renderAllPanels);
}

function loadSamplePhoto(name) {
  const safeName = /^[a-z0-9-]+$/i.test(name || '') ? name : 'pier';
  return `samples/${safeName}.jpg`;
}

function applyShotContract() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const photo = params.get('photo');
  const caption = params.get('caption');
  if (caption) setCaption(caption);
  if (photo) {
    const src = loadSamplePhoto(photo);
    state.panels.forEach((_, index) => setPanelPhoto(index, src));
    // Give the cover shot a little life: alternate panels get a gentle
    // zoom so the angled cuts read clearly in a still screenshot.
    state.panels[1].zoom = 1.18;
    state.panels[4].zoom = 1.12;
    renderAllPanels();
  }
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
  } else if (shot === 'editor') {
    document.body.classList.add('shot-editor');
  }
  return shot;
}

function init() {
  buildPanelElements();
  buildPanelPicker();
  wireControls();
  setGrade(55);
  setCaptionScale(100);
  const shot = applyShotContract();
  if (!shot) {
    // Friendly first paint: start with a sample photo across the panels
    // so the layout, grade and caption are visible before any upload.
    const src = loadSamplePhoto('pier');
    state.panels.forEach((_, index) => setPanelPhoto(index, src));
  }
  selectPanel(0);
  renderAllPanels();
}

init();
