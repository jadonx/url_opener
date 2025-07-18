const presetBar = document.getElementById("presetBar");
const urlInput = document.getElementById("urlInput");
const addPresetBtn = document.getElementById("addPresetBtn");

let currentPreset = "Default";
let order = [];
let presets = {};
const DEFAULT_PRESET = "Default";

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

  Object.keys(presets).forEach(name => {
    const tab = document.createElement("div");
    tab.className = "preset-tab";
    tab.textContent = name;
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

    presetBar.insertBefore(tab, addPresetBtn);
  });
}

// Save presets to storage
function savePresets() {
  chrome.storage.local.set({ presets });
}

// Add new preset
addPresetBtn.onclick = () => {
  const name = prompt("Enter preset name:");
  if (!name || presets[name] || name === DEFAULT_PRESET) return;

  presets[name] = [];
  currentPreset = name;
  urlInput.value = "";
  savePresets();
  renderPresetTabs();
};

// Open URLs
document.getElementById("openUrls").addEventListener("click", () => {
  const urls = urlInput.value.split("\n").map(url => url.trim()).filter(Boolean);
  
  urls.forEach(url => {
    const validUrl = /^https?:\/\//.test(url) ? url : "https://" + url;
    chrome.tabs.create({ url: validUrl });
  });
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
    savePresets();
    renderPresetTabs();
  }
  contextMenu.classList.add("hidden");
});
