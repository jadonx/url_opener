const presetBar = document.getElementById("presetBar");
const urlInput = document.getElementById("urlInput");
const addPresetBtn = document.getElementById("addPresetBtn");

let currentPreset = "df";
let order = [];
let presets = {};
const DEFAULT_PRESET = "df";

// Load presets and render
chrome.storage.local.get(["presets", "presetOrder"], data => {
  presets = data.presets || {};
  order = data.presetOrder || Object.keys(presets);
  renderPresetTabs();
});


// Render preset tabs
function renderPresetTabs() {
  // Remove all but the default and add button
  Array.from(presetBar.children).forEach(child => {
    if (child !== addPresetBtn && child !== contextMenu) presetBar.removeChild(child);
  });

  // Render default preset tab
  const defaultTab = document.createElement("div");
  defaultTab.className = "preset-tab";
  defaultTab.textContent = DEFAULT_PRESET;
  if (currentPreset === DEFAULT_PRESET) defaultTab.classList.add("active");

  defaultTab.onclick = () => {
    currentPreset = DEFAULT_PRESET;
    urlInput.value = "";
    renderPresetTabs();
  };

  presetBar.insertBefore(defaultTab, addPresetBtn);

  order.forEach(name => {
    const tab = document.createElement("div");
    tab.className = "preset-tab";
    tab.textContent = name;
    tab.draggable = true;
    if (name === currentPreset) tab.classList.add("active");

    tab.onclick = () => {
      currentPreset = name;
      urlInput.value = presets[name].join("\n");
      renderPresetTabs();
    };

    tab.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (name !== DEFAULT_PRESET) {
            rightClickedPreset = name;
            showContextMenu(e.pageX, e.pageY);
        }
    });

    tab.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", name);
      tab.classList.add("dragging");
    });
    
    tab.addEventListener("dragover", (e) => {
      e.preventDefault(); // Required!
      tab.classList.add("drag-over");
    });

    tab.addEventListener("dragleave", () => {
      tab.classList.remove("drag-over");
    });

    tab.addEventListener("drop", (e) => {
      e.preventDefault();
      tab.classList.remove("drag-over");

      const draggedName = e.dataTransfer.getData("text/plain");
      const targetName = name;

      if (draggedName !== targetName) {
        const fromIndex = order.indexOf(draggedName);
        const toIndex = order.indexOf(targetName);

        order.splice(fromIndex, 1);         // Remove dragged item from old position
        order.splice(toIndex, 0, draggedName); // Insert at new position

        savePresets();
        renderPresetTabs();
      }
    });

    tab.addEventListener("dragend", () => {
      tab.classList.remove("dragging");
    });

    presetBar.insertBefore(tab, addPresetBtn);
  });
}

// Save presets to storage
function savePresets() {
  chrome.storage.local.set({ presets, presetOrder: order });
}

// Add new preset
addPresetBtn.onclick = () => {
  const name = prompt("Enter preset name:");
  if (!name || presets[name] || name === DEFAULT_PRESET) return;

  presets[name] = [];
  order.push(name);
  currentPreset = name;
  urlInput.value = "";
  savePresets();
  renderPresetTabs();
};

// Open URLs
document.getElementById("openUrls").addEventListener("click", () => {
  const urls = urlInput.value
    .split("\n")
    .map(url => url.trim())
    .filter(Boolean);

  chrome.runtime.sendMessage({ action: "openURLs", urls });
});

// Save presets dynamically
urlInput.addEventListener("input", () => {
  if (currentPreset !== DEFAULT_PRESET) {
    const urls = urlInput.value
      .split("\n")
      .map(url => url.trim())
      .filter(Boolean);
    presets[currentPreset] = urls;
    savePresets();
  }
});

// Context Menu
const contextMenu = document.getElementById("contextMenu");
const renameOption = document.getElementById("renamePreset");
const deleteOption = document.getElementById("deletePreset");

let rightClickedPreset = null;

document.addEventListener("click", () => {
  contextMenu.classList.add("hidden");
});

function showContextMenu(x, y) {
  contextMenu.style.top = `${y}px`;
  contextMenu.style.left = `${x}px`;
  contextMenu.classList.remove("hidden");
  console.log("hidden removed");
}

renameOption.addEventListener("click", () => {
  const newName = prompt("Enter new name for preset:", rightClickedPreset);
  if (newName && newName !== rightClickedPreset) {
    if (presets[newName]) {
      alert("Preset with this name already exists.");
    } else {
      presets[newName] = presets[rightClickedPreset];
      delete presets[rightClickedPreset];
      if (currentPreset === rightClickedPreset) currentPreset = newName;
      const index = order.indexOf(rightClickedPreset);
      if (index !== -1) order[index] = newName;
      savePresets();
      renderPresetTabs();
    }
  }
  contextMenu.classList.add("hidden");
});

deleteOption.addEventListener("click", () => {
  if (confirm(`Delete preset "${rightClickedPreset}"?`)) {
    delete presets[rightClickedPreset];
    if (currentPreset === rightClickedPreset) {
      currentPreset = DEFAULT_PRESET;
      urlInput.value = "";
    }
    order = order.filter(name => name !== rightClickedPreset);
    savePresets();
    renderPresetTabs();
  }
  contextMenu.classList.add("hidden");
});
