# Vermont Rural Water Association Mutual Aid Map

The Vermont Rural Water Association (VRWA) Mutual Aid Map is a lightweight static website for viewing and managing mutual aid resources (equipment, personnel, and related assets).

## What this project is

- Static HTML/CSS/JavaScript site (no build step required)
- Main pages:
  - `index.html` (map view)
  - `list.html` (table/list view)
  - `manage.html` (add/edit/update local data)
- Data source:
  - `locations.geojson` (base map/resource data)
  - `js/data.js` (data layer and local storage merge logic)

## Run locally (recommended for editing)

Use a local HTTP server so browser fetch requests work correctly.

### Option A: Python (recommended)

From the project folder:

```bash
python -m http.server 8000
```

Then open:

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/index.html`

Stop server with `Ctrl+C`.

### Why not open by double-click?

Opening `index.html` directly as `file://...` can block `fetch('locations.geojson')` in many browsers. Running a local server avoids that.

## Local editing workflow

1. Start local server (`python -m http.server 8000`)
2. Edit files in this repo
3. Refresh browser (`Cmd+R`)
4. If changes seem stale, hard refresh (`Cmd+Shift+R`)

### Files you will edit most often

- `locations.geojson`
  - Add/edit/remove base resources and coordinates
- `js/data.js`
  - Data mapping, categories, statuses, data loading/merge behavior
- `index.html`, `list.html`, `manage.html`
  - UI and page behavior
- `css/style.css`
  - Shared styling

## How to Use This Map

### Viewing resources

- Open `index.html` to view resources on the map
- Open `list.html` to view/search/sort resources in table form
- Open `manage.html` to add items or change statuses

### How data is saved

- Base/shared data is stored in `locations.geojson`
- Changes made in `manage.html` are saved in your browser `localStorage` by default
- Local storage keys used by the app:
  - `vrwa_items` (locally added items)
  - `vrwa_overrides` (status overrides for base items)

### What this means for updates

- Browser-saved changes are local to that browser/profile/device
- Browser-saved changes are not automatically written back to `locations.geojson`
- To make updates permanent and shareable, edit `locations.geojson` in the repository
- After editing `locations.geojson`, reload the site and commit/push those file changes if using Git

## How data updates work

The app loads base data from `locations.geojson` and also supports browser-local edits from `manage.html` using `localStorage`.

- Base data fetch: `js/data.js` (`fetch('locations.geojson')`)
- Local keys:
  - `vrwa_items` (user-added local items)
  - `vrwa_overrides` (status overrides)

If you want to test only base GeoJSON data, clear site storage in browser dev tools.

## Updating the map data (`locations.geojson`)

Each feature should be a GeoJSON `Feature` with:

- Geometry: `Point` with `[lon, lat]`
- Properties (expected):
  - `id`, `name`, `category`, `systemType`, `organization`, `town`, `state`, `status`, `quantity`, `description`, `contact`

After editing `locations.geojson`:

1. Save file
2. Refresh `index.html`
3. Verify marker appears in the correct location

## Troubleshooting

- Blank map:
  - Confirm server is running and you are using `http://127.0.0.1:8000/` (not `file://`)
  - Check browser console for JavaScript errors
  - Confirm external tile/CDN access
- No data markers:
  - Check `locations.geojson` is valid JSON/GeoJSON
  - Confirm coordinates are numeric and in `[lon, lat]` order
  - Hard refresh browser cache

## License

See `LICENSE`.