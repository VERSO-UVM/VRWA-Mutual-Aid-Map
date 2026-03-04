/**
 * data.js – shared data layer for VRWA Mutual Aid Map
 * Base items come from locations.geojson; user-added items are stored in localStorage.
 */

const DATA_KEY  = 'vrwa_items';
const OVER_KEY  = 'vrwa_overrides'; // status overrides for base items
const EDIT_KEY  = 'vrwa_base_edits';
const DEL_KEY   = 'vrwa_deleted_ids';

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Mobile Treatment',
  'Generator',
  'Pump',
  'Emergency Trailer',
  'Water Supply',
  'Pump Station',
  'Vacuum/Vactor Truck',
  'Detection Equipment',
  'Sewer Equipment',
  'Personnel',
  'Other'
];

const CATEGORY_ICONS = {
  'Mobile Treatment':    '🚿',
  'Generator':          '⚡',
  'Pump':               '💧',
  'Emergency Trailer':  '🚛',
  'Water Supply':       '🪣',
  'Pump Station':       '🏭',
  'Vacuum/Vactor Truck':'🚚',
  'Detection Equipment':'📡',
  'Sewer Equipment':    '🔧',
  'Personnel':          '👷',
  'Other':              '📦'
};

const STATES = ['CT', 'MA', 'ME', 'NH', 'NY', 'RI', 'VT'];

const SYSTEM_TYPES = {
  drinking_water: 'Drinking Water',
  wastewater:     'Wastewater',
  both:           'Both'
};

const STATUSES = {
  available:   'Available',
  deployed:    'Deployed',
  unavailable: 'Unavailable'
};

const STATUS_COLORS = {
  available:   '#27ae60',
  deployed:    '#e67e22',
  unavailable: '#c0392b'
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function genId() {
  return 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function featureToItem(f) {
  const p = f.properties || {};
  return {
    id:           p.id          || genId(),
    name:         p.name        || '',
    category:     p.category    || 'Other',
    systemType:   p.systemType  || 'both',
    organization: p.organization|| '',
    town:         p.town        || '',
    state:        p.state       || 'VT',
    status:       p.status      || 'available',
    quantity:     p.quantity    || 1,
    description:  p.description || '',
    contact:      p.contact     || '',
    lastUpdated:  p.lastUpdated || '',
    lat:          f.geometry.coordinates[1],
    lon:          f.geometry.coordinates[0],
    source:       'base'
  };
}

function itemToFeature(item) {
  return {
    type: 'Feature',
    properties: {
      id:           item.id,
      name:         item.name,
      category:     item.category,
      systemType:   item.systemType,
      organization: item.organization,
      town:         item.town,
      state:        item.state,
      status:       item.status,
      quantity:     item.quantity,
      description:  item.description,
      contact:      item.contact,
      lastUpdated:  item.lastUpdated || ''
    },
    geometry: { type: 'Point', coordinates: [parseFloat(item.lon), parseFloat(item.lat)] }
  };
}

// ── Storage ───────────────────────────────────────────────────────────────────

function loadUserItems() {
  try { return JSON.parse(localStorage.getItem(DATA_KEY) || '[]'); } catch { return []; }
}

function saveUserItems(items) {
  localStorage.setItem(DATA_KEY, JSON.stringify(items));
}

function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(OVER_KEY) || '{}'); } catch { return {}; }
}

function saveOverrides(ov) {
  localStorage.setItem(OVER_KEY, JSON.stringify(ov));
}

function loadBaseEdits() {
  try { return JSON.parse(localStorage.getItem(EDIT_KEY) || '{}'); } catch { return {}; }
}

function saveBaseEdits(edits) {
  localStorage.setItem(EDIT_KEY, JSON.stringify(edits));
}

function loadDeletedIds() {
  try {
    const value = JSON.parse(localStorage.getItem(DEL_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveDeletedIds(ids) {
  localStorage.setItem(DEL_KEY, JSON.stringify(ids));
}

// ── Public API ────────────────────────────────────────────────────────────────

let _base = null; // cached base items

async function fetchBase() {
  if (_base) return _base;
  const r = await fetch('locations.geojson');
  const d = await r.json();
  _base = d.features.map(featureToItem);
  return _base;
}

async function getAllItems() {
  const base      = await fetchBase();
  const overrides = loadOverrides();
  const edits     = loadBaseEdits();
  const deleted   = new Set(loadDeletedIds());
  const user      = loadUserItems();

  // Apply status overrides to base items
  const baseMerged = base
    .filter(item => !deleted.has(item.id))
    .map(item => ({
      ...item,
      ...(edits[item.id] || {}),
      status: overrides[item.id] || (edits[item.id]?.status || item.status)
    }));

  const userMerged = user.filter(item => !deleted.has(item.id));
  return [...baseMerged, ...userMerged];
}

function addItem(data) {
  const item = { ...data, id: genId(), source: 'user', lastUpdated: getTodayDate() };
  const items = loadUserItems();
  items.push(item);
  saveUserItems(items);
  return item;
}

function updateItem(id, data) {
  const updatedData = { ...data, lastUpdated: getTodayDate() };

  // Check user items first
  const items = loadUserItems();
  const idx   = items.findIndex(i => i.id === id);
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...updatedData };
    saveUserItems(items);
    return true;
  }

  // For base items, save editable field overrides locally
  const edits = loadBaseEdits();
  edits[id] = { ...(edits[id] || {}), ...updatedData };
  saveBaseEdits(edits);

  if (updatedData.status) {
    const ov = loadOverrides();
    ov[id] = updatedData.status;
    saveOverrides(ov);
  }

  const deleted = loadDeletedIds();
  if (deleted.includes(id)) {
    saveDeletedIds(deleted.filter(itemId => itemId !== id));
  }

  return true;
}

function deleteItem(id) {
  const items    = loadUserItems();
  const filtered = items.filter(i => i.id !== id);
  if (filtered.length < items.length) {
    saveUserItems(filtered);
    return true;
  }

  const deleted = loadDeletedIds();
  if (!deleted.includes(id)) {
    deleted.push(id);
    saveDeletedIds(deleted);
  }

  const ov = loadOverrides();
  if (ov[id]) {
    delete ov[id];
    saveOverrides(ov);
  }

  const edits = loadBaseEdits();
  if (edits[id]) {
    delete edits[id];
    saveBaseEdits(edits);
  }

  return true;
}

async function exportGeoJSON() {
  const items = await getAllItems();
  return JSON.stringify({
    type: 'FeatureCollection',
    features: items.map(itemToFeature)
  }, null, 2);
}

// Expose globally
window.VRWAData = {
  CATEGORIES, CATEGORY_ICONS, STATES, SYSTEM_TYPES, STATUSES, STATUS_COLORS,
  getAllItems, addItem, updateItem, deleteItem, exportGeoJSON
};
