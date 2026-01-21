/* =======================
   UNDO / REDO
======================= */

const undoStack = [];
const redoStack = [];
const MAX_HISTORY = 50;

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

function snapshot() {
  undoStack.push(JSON.parse(JSON.stringify(state.elements)));
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack.length = 0;
  updateHistoryButtons();
}

function restore(elements) {
  state.elements = JSON.parse(JSON.stringify(elements));
  state.selectedId = null;

  canvas.innerHTML = "";
  state.elements.forEach(el => renderElement(el));
  renderLayers();
  autoSave();
  updateHistoryButtons();
}

function updateHistoryButtons() {
  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

/* =======================
   DOM REFERENCES
======================= */

const canvas = document.getElementById("canvas");
const addRectBtn = document.getElementById("addRect");
const addTextBtn = document.getElementById("addText");
const layersList = document.getElementById("layersList");

const layerUpBtn = document.getElementById("layerUp");
const layerDownBtn = document.getElementById("layerDown");

const propWidth = document.getElementById("propWidth");
const propHeight = document.getElementById("propHeight");
const colorInput = document.getElementById("colorInput");
const propText = document.getElementById("propText");
const propRotate = document.getElementById("propRotate");

const exportJsonBtn = document.getElementById("exportJson");
const importJsonBtn = document.getElementById("importJson");
const exportHtmlBtn = document.getElementById("exportHtml");
const importFileInput = document.getElementById("importFile");

const MIN_SIZE = 20;
let idCounter = 1;

/* =======================
   STATE
======================= */
let clipboard = null;

const state = {
  elements: [],
  selectedId: null
};

/* =======================
   HELPERS
======================= */

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function getSelected() {
  return state.elements.find(e => e.id === state.selectedId);
}

/* =======================
   CREATE ELEMENT
======================= */

addRectBtn.onclick = () => create("rectangle");
addTextBtn.onclick = () => create("text");

function create(type) {
  const el = {
    id: "el_" + idCounter++,
    type,
    x: 40,
    y: 40,
    width: type === "text" ? 120 : 100,
    height: type === "text" ? 30 : 100,
    background: type === "text" ? "transparent" : "#6366f1",
    content: type === "text" ? "Edit text" : "",
    rotation: 0
  };

  state.elements.push(el);
snapshot();

renderElement(el);
requestAnimationFrame(() => {
  select(el.id); // 🔥 ensures DOM exists before selection
});

autoSave();

}

/* =======================
   RENDER
======================= */

function renderElement(el) {
  const div = document.createElement("div");
  div.className = `element ${el.type}`;
  div.dataset.id = el.id;

  if (el.type === "text") {
    div.textContent = el.content;
    div.contentEditable = true;
    div.oninput = () => {
      el.content = div.textContent;
      autoSave();
    };
  }

  div.onmousedown = startDrag;

div.onclick = e => {
  e.stopPropagation();
  if (state.selectedId !== el.id) {
    select(el.id);
  }
};

  canvas.appendChild(div);
  updateStyle(div, el);
}

function updateStyle(div, el) {
  div.style.left = el.x + "px";
  div.style.top = el.y + "px";
  div.style.width = el.width + "px";
  div.style.height = el.height + "px";
  div.style.background = el.background;
  div.style.transform = `rotate(${el.rotation}deg)`;
  div.style.zIndex = state.elements.indexOf(el) + 1;
}

/* =======================
   SELECTION
======================= */

function select(id) {
  state.selectedId = id;

  document.querySelectorAll(".element").forEach(el => {
    el.classList.toggle("selected", el.dataset.id === id);
    el.querySelectorAll(".resize-handle,.rotate-handle").forEach(h => h.remove());
  });

  const el = getSelected();
  if (!el) return;

  const div = document.querySelector(`[data-id="${id}"]`);
  addResizeHandles(div);
  addRotateHandle(div);

  propWidth.value = el.width;
  propHeight.value = el.height;
  propRotate.value = el.rotation;
  colorInput.value = el.background || "#000000";

  propText.disabled = el.type !== "text";
  propText.value = el.type === "text" ? el.content : "";

  renderLayers();
}

canvas.onclick = () => {
  state.selectedId = null;
  document.querySelectorAll(".element").forEach(el => {
    el.classList.remove("selected");
    el.querySelectorAll(".resize-handle,.rotate-handle").forEach(h => h.remove());
  });
  renderLayers();
};

/* =======================
   DRAG
======================= */

let dragData = null;

function startDrag(e) {
  const id = e.currentTarget.dataset.id;
  if (!id) return;

  // 🔥 FORCE selection before dragging
  if (state.selectedId !== id) {
    select(id);
  }

  if (
    e.target.classList.contains("resize-handle") ||
    e.target.classList.contains("rotate-handle")
  ) return;

  const el = getSelected();
  if (!el) return;

  snapshot();

  dragData = {
    startX: e.clientX,
    startY: e.clientY,
    x: el.x,
    y: el.y
  };

  document.onmousemove = drag;
  document.onmouseup = () => dragData = null;
}


function drag(e) {
  if (!dragData) return;
  const el = getSelected();

  el.x = clamp(dragData.x + e.clientX - dragData.startX, 0, canvas.clientWidth - el.width);
  el.y = clamp(dragData.y + e.clientY - dragData.startY, 0, canvas.clientHeight - el.height);

  updateStyle(document.querySelector(`[data-id="${el.id}"]`), el);
  autoSave();
}

/* =======================
   RESIZE
======================= */

function addResizeHandles(div) {
  ["nw","ne","sw","se"].forEach(pos => {
    const h = document.createElement("div");
    h.className = `resize-handle ${pos}`;
    h.dataset.pos = pos;
    h.onmousedown = startResize;
    div.appendChild(h);
  });
}

let resizeData = null;

function startResize(e) {
  e.stopPropagation();
  snapshot();

  const el = getSelected();
  resizeData = {
    ...el,
    startX: e.clientX,
    startY: e.clientY,
    pos: e.target.dataset.pos
  };

  document.onmousemove = resize;
  document.onmouseup = () => resizeData = null;
}

function resize(e) {
  if (!resizeData) return;
  const el = getSelected();

  const dx = e.clientX - resizeData.startX;
  const dy = e.clientY - resizeData.startY;

  let newX = el.x;
  let newY = el.y;
  let newW = el.width;
  let newH = el.height;

  if (resizeData.pos.includes("e")) newW = resizeData.width + dx;
  if (resizeData.pos.includes("s")) newH = resizeData.height + dy;
  if (resizeData.pos.includes("w")) {
    newW = resizeData.width - dx;
    newX = resizeData.x + dx;
  }
  if (resizeData.pos.includes("n")) {
    newH = resizeData.height - dy;
    newY = resizeData.y + dy;
  }

  newW = clamp(newW, MIN_SIZE, canvas.clientWidth - newX);
  newH = clamp(newH, MIN_SIZE, canvas.clientHeight - newY);
  newX = clamp(newX, 0, canvas.clientWidth - newW);
  newY = clamp(newY, 0, canvas.clientHeight - newH);

  el.x = newX;
  el.y = newY;
  el.width = newW;
  el.height = newH;

  updateStyle(document.querySelector(`[data-id="${el.id}"]`), el);
  autoSave();
}

/* =======================
   ROTATION
======================= */

function addRotateHandle(div) {
  const h = document.createElement("div");
  h.className = "rotate-handle";

  h.innerHTML = `<i data-lucide="rotate-cw"></i>`;
  h.onmousedown = startRotate;

  div.appendChild(h);
  lucide.createIcons(); // re-render icon
}

function startRotate(e) {
  e.stopPropagation();
  snapshot();

  const el = getSelected();
  const rect = e.target.parentElement.getBoundingClientRect();

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  document.onmousemove = ev => {
    const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx);
    el.rotation = angle * 180 / Math.PI + 90;
    updateStyle(document.querySelector(`[data-id="${el.id}"]`), el);
    autoSave();
  };

  document.onmouseup = () => document.onmousemove = null;
}

/* =======================
   PROPERTIES PANEL
======================= */

propWidth.oninput = () => {
  const el = getSelected();
  if (!el) return;
  el.width = Math.max(MIN_SIZE, propWidth.value);
  updateStyle(document.querySelector(`[data-id="${el.id}"]`), el);
  autoSave();
};

propHeight.oninput = () => {
  const el = getSelected();
  if (!el) return;
  el.height = Math.max(MIN_SIZE, propHeight.value);
  updateStyle(document.querySelector(`[data-id="${el.id}"]`), el);
  autoSave();
};

propRotate.oninput = () => {
  const el = getSelected();
  if (!el) return;
  el.rotation = Number(propRotate.value) || 0;
  updateStyle(document.querySelector(`[data-id="${el.id}"]`), el);
  autoSave();
};

colorInput.oninput = e => {
  const el = getSelected();
  if (!el) return;
  el.background = e.target.value;
  updateStyle(document.querySelector(`[data-id="${el.id}"]`), el);
  autoSave();
};

propText.oninput = () => {
  const el = getSelected();
  if (!el || el.type !== "text") return;
  el.content = propText.value;
  document.querySelector(`[data-id="${el.id}"]`).textContent = el.content;
  autoSave();
};

/* =======================
   KEYBOARD MOVE + DELETE
======================= */

document.addEventListener("keydown", e => {
  const el = getSelected();
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

  /* ---------- COPY ---------- */
  if (ctrlKey && e.key.toLowerCase() === "c") {
    if (!el) return;
    clipboard = JSON.parse(JSON.stringify(el));
    e.preventDefault();
    return;
  }

  /* ---------- PASTE ---------- */
  if (ctrlKey && e.key.toLowerCase() === "v") {
    if (!clipboard) return;

    snapshot();

    const copy = JSON.parse(JSON.stringify(clipboard));
    copy.id = "el_" + idCounter++;
    copy.x += 20;
    copy.y += 20;

    // Keep inside canvas bounds
    copy.x = clamp(copy.x, 0, canvas.clientWidth - copy.width);
    copy.y = clamp(copy.y, 0, canvas.clientHeight - copy.height);

    state.elements.push(copy);
    renderElement(copy);
    select(copy.id);
    renderLayers();
    autoSave();

    e.preventDefault();
    return;
  }

  /* ---------- DELETE ---------- */
  if (e.key === "Delete" && el) {
    snapshot();
    document.querySelector(`[data-id="${el.id}"]`).remove();
    state.elements = state.elements.filter(x => x.id !== el.id);
    state.selectedId = null;
    renderLayers();
    autoSave();
    return;
  }

  /* ---------- ARROW MOVE ---------- */
  if (!el) return;

  const step = 5;

  if (e.key.startsWith("Arrow")) {
    e.preventDefault();

    if (e.key === "ArrowUp") el.y -= step;
    if (e.key === "ArrowDown") el.y += step;
    if (e.key === "ArrowLeft") el.x -= step;
    if (e.key === "ArrowRight") el.x += step;

    el.x = clamp(el.x, 0, canvas.clientWidth - el.width);
    el.y = clamp(el.y, 0, canvas.clientHeight - el.height);

    updateStyle(document.querySelector(`[data-id="${el.id}"]`), el);
    autoSave();
  }
});


/* =======================
   LAYERS PANEL
======================= */

function renderLayers() {
  layersList.innerHTML = "";
  [...state.elements].reverse().forEach(el => {
    const div = document.createElement("div");
    div.className = "layer-item" + (el.id === state.selectedId ? " selected" : "");
    div.textContent = el.type + " " + el.id;
   div.onclick = () => {
  if (state.selectedId !== el.id) {
    select(el.id);
  }
};

    layersList.appendChild(div);
  });
}

function moveLayer(direction) {
  const index = state.elements.findIndex(e => e.id === state.selectedId);
  if (index === -1) return;

  const newIndex = direction === "up" ? index + 1 : index - 1;
  if (newIndex < 0 || newIndex >= state.elements.length) return;

  snapshot();
  const [el] = state.elements.splice(index, 1);
  state.elements.splice(newIndex, 0, el);

  canvas.innerHTML = "";
  state.elements.forEach(renderElement);
  select(el.id);
  renderLayers();
  autoSave();
}

layerUpBtn.onclick = () => moveLayer("up");
layerDownBtn.onclick = () => moveLayer("down");

/* =======================
   SAVE / LOAD
======================= */

const STORAGE_KEY = "mini-figma-layout";

function autoSave() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.elements));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  state.elements = JSON.parse(saved);
  canvas.innerHTML = "";
  state.elements.forEach(renderElement);
  renderLayers();
}

window.addEventListener("load", loadState);

/* =======================
   IMPORT / EXPORT (ADDED)
======================= */

// Export JSON
exportJsonBtn.onclick = () => {
  const blob = new Blob([JSON.stringify(state.elements, null, 2)], {
    type: "application/json"
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "design.json";
  a.click();
};

// Import JSON
importJsonBtn.onclick = () => importFileInput.click();

importFileInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    try {
      snapshot();
      state.elements = JSON.parse(ev.target.result);
      canvas.innerHTML = "";
      state.elements.forEach(renderElement);
      renderLayers();
      autoSave();
    } catch {
      alert("Invalid JSON file");
    }
  };
  reader.readAsText(file);
  importFileInput.value = "";
};

// Export HTML
exportHtmlBtn.onclick = () => {
  const html = `
<!DOCTYPE html>
<html>
<body>
<div style="position:relative;width:100vw;height:100vh;">
${state.elements.map(el => `
<div style="
position:absolute;
left:${el.x}px;
top:${el.y}px;
width:${el.width}px;
height:${el.height}px;
background:${el.background};
transform:rotate(${el.rotation}deg);
">${el.type === "text" ? el.content : ""}</div>
`).join("")}
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "design.html";
  a.click();
};

/* =======================
   UNDO / REDO BUTTONS
======================= */

undoBtn.onclick = () => {
  if (!undoStack.length) return;
  redoStack.push(JSON.parse(JSON.stringify(state.elements)));
  restore(undoStack.pop());
};

redoBtn.onclick = () => {
  if (!redoStack.length) return;
  undoStack.push(JSON.parse(JSON.stringify(state.elements)));
  restore(redoStack.pop());
};
