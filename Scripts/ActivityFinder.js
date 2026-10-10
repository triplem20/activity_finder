/* ACTIVITY FINDER: map, search, nearby places and user activities */

// The Foursquare key lives on the server (see api/places.js), never in this file.
// VS Code Live Server (ports 5500-5502) has no /api folder, so while developing there we call the Node dev server (node server.js) on port 3000.
const LIVE_SERVER = ['localhost', '127.0.0.1'].includes(location.hostname) && ['5500', '5501', '5502'].includes(location.port);
const PLACES_ENDPOINT = LIVE_SERVER ? 'http://localhost:3000/api/places' : '/api/places';
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const STORAGE_KEY = 'af_user_activities';

const map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

/* ---------- icons ---------- */
const SHADOW = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png';
function makeIcon(url, size, anchor, popupAnchor) {
    const opts = { iconUrl: url, iconSize: size, iconAnchor: anchor, shadowUrl: SHADOW, shadowSize: [41, 41] };
    if (popupAnchor) opts.popupAnchor = popupAnchor;
    return L.icon(opts);
}
const restaurantIcon = makeIcon('../images/resturanticon.png', [35, 45], [15, 41], [1, -34]);
const sportsIcon = makeIcon('../images/sportsicon.png', [30, 41], [15, 41], [1, -34]);
const eventIcon = makeIcon('../images/eventsicon.png', [30, 41], [15, 41], [1, -34]);
const userActivityIcon = makeIcon('../images/useractivity.png', [30, 41], [15, 41], [1, -34]);
const adventureIcon = makeIcon('../images/tourism.png', [32, 32], [16, 32]);
const relaxIcon = makeIcon('../images/exercise.png', [32, 32], [16, 32]);
const creativeIcon = makeIcon('../images/design-thinking.png', [32, 32], [16, 32]);
const socialRomanticIcon = makeIcon('../images/group.png', [32, 32], [16, 32]);
const energeticIcon = makeIcon('../images/energy-drink.png', [32, 32], [16, 32]);
const intellectualPlayfulIcon = makeIcon('../images/intellectual-property.png', [32, 32], [16, 32]);
const natureFestiveIcon = makeIcon('../images/forest.png', [32, 32], [16, 32]);

/* Each filter / mood maps to an icon and a real search term for Foursquare.
   "libary" is kept because ActivityFinder.html uses data-type="libary". */
const TYPES = {
    restaurant: { icon: restaurantIcon, query: 'restaurant' },
    sports: { icon: sportsIcon, query: 'sports' },
    events: { icon: eventIcon, query: 'events' },
    event: { icon: eventIcon, query: 'events' },
    adventure: { icon: adventureIcon, query: 'hiking' },
    relax: { icon: relaxIcon, query: 'spa' },
    creative: { icon: creativeIcon, query: 'art gallery' },
    social: { icon: socialRomanticIcon, query: 'bar' },
    energetic: { icon: energeticIcon, query: 'gym' },
    libary: { icon: intellectualPlayfulIcon, query: 'library' },
    library: { icon: intellectualPlayfulIcon, query: 'library' },
    nature: { icon: natureFestiveIcon, query: 'park' }
};

/* ---------- state ---------- */
let userMarker = null, userCircle = null;
let userPos = null;                       // the user's real position, once known
let activeCenter = map.getCenter();       // where searches are centred (user, or a searched place)
let currentType = 'restaurant';
let locationNotice = '';                  // shown above the list when we could not use the user's location
let searchMarker = null, tempMarker = null, routingControl = null;
let resultMarkers = [];
const userActivities = [];                // { marker, data } for activities users add

/* ---------- small helpers ---------- */
const $ = id => document.getElementById(id);

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;   // textContent: no HTML injection
    return node;
}

function popupFor(title, subtitle) {
    const box = el('div');
    box.append(el('strong', null, title));
    if (subtitle) { box.append(el('br'), document.createTextNode(subtitle)); }
    return box;
}

function showLoading(on) { $('loadingIndicator').style.display = on ? 'block' : 'none'; }

function setStatus(text) {
    let status = $('listStatus');
    if (!status) {
        status = el('p', 'empty-state');
        status.id = 'listStatus';
        $('activityList').before(status);
    }
    status.textContent = text;
    status.style.display = text ? 'block' : 'none';
}

function calculateDistance(lat1, lon1, lat2, lon2) {   // Haversine, km
    const R = 6371, rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ---------- geocoding ---------- */
const COORD_RE = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

// Accepts "lat,lng" (no lookup needed) or an address (Nominatim). Returns {lat,lng,label} or null.
async function geocode(text) {
    const m = COORD_RE.exec(text);
    if (m) {
        const lat = +m[1], lng = +m[2];
        return (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) ? { lat, lng, label: text.trim() } : null;
    }
    const res = await fetch(`${NOMINATIM}/search?q=${encodeURIComponent(text)}&format=json&limit=1`);
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    return data.length ? { lat: +data[0].lat, lng: +data[0].lon, label: data[0].display_name } : null;
}

async function detectCity(lat, lng) {
    try {
        const res = await fetch(`${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        const a = data.address || {};
        const city = a.city || a.town || a.village || a.municipality || a.county || a.state;
        if (!city) return;
        window.currentCity = city;
        // firebase.js listens for this and saves it to the user's profile (see notes)
        window.dispatchEvent(new CustomEvent('af:city', { detail: { city } }));
    } catch (err) {
        console.error('Reverse geocoding error:', err);
    }
}

/* ---------- user location ---------- */
function locateUser() {
    const fallback = message => {
        activeCenter = map.getCenter();
        locationNotice = message;
        setStatus(message);
        fetchActivities(activeCenter, currentType);
    };
    if (!navigator.geolocation) { fallback('Location is not available here. Showing the map area instead.'); return; }

    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        userPos = { lat, lng };
        activeCenter = userPos;
        locationNotice = '';

        if (userMarker) { map.removeLayer(userMarker); map.removeLayer(userCircle); }
        userMarker = L.marker([lat, lng]).addTo(map).bindPopup('You are here!').openPopup();
        userCircle = L.circle([lat, lng], { radius: accuracy }).addTo(map);
        map.setView([lat, lng], 14);

        detectCity(lat, lng);
        fetchActivities(activeCenter, currentType);
    }, () => fallback('Could not get your location. Showing the map area instead.'),
    { timeout: 10000, maximumAge: 60000 });
}

/* ---------- nearby places ---------- */
let fetchToken = 0, fetchController = null;

function normalizePlace(p) {
    // Works with the current Foursquare shape (latitude/longitude) and the old one (geocodes.main)
    const lat = p.latitude ?? p.geocodes?.main?.latitude;
    const lng = p.longitude ?? p.geocodes?.main?.longitude;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    return {
        name: p.name || 'Unknown',
        lat, lng,
        category: p.categories?.[0]?.name || '',
        address: p.location?.formatted_address || p.location?.address || ''
    };
}

async function fetchActivities(center, type = currentType) {
    const cfg = TYPES[type] || TYPES.restaurant;
    if (fetchController) fetchController.abort();          // a newer request replaces the old one
    fetchController = new AbortController();
    const token = ++fetchToken;
    showLoading(true);

    try {
        const url = `${PLACES_ENDPOINT}?ll=${center.lat},${center.lng}&query=${encodeURIComponent(cfg.query)}&limit=20`;
        const res = await fetch(url, { signal: fetchController.signal });
        if (!res.ok) throw new Error(`Places request failed (${res.status})`);
        const data = await res.json();
        if (token !== fetchToken) return;
        const places = (data.results || []).map(normalizePlace).filter(Boolean);
        renderResults(places, center, type);
    } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching activities:', err);
        if (token === fetchToken) setStatus('Could not load activities right now. Please try again.');
    } finally {
        if (token === fetchToken) showLoading(false);
    }
}

function renderResults(places, center, type) {
    resultMarkers.forEach(m => map.removeLayer(m));
    resultMarkers = [];
    const list = $('activityList');
    list.replaceChildren();

    if (!places.length) { setStatus('No activities found nearby.'); return; }
    setStatus(locationNotice);

    places.forEach(p => { p.distance = calculateDistance(center.lat, center.lng, p.lat, p.lng); });
    places.sort((a, b) => a.distance - b.distance);

    const icon = (TYPES[type] || {}).icon || userActivityIcon;

    places.forEach(p => {
        const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
        marker.bindPopup(popupFor(p.name, p.category || type));
        resultMarkers.push(marker);

        const item = el('div', 'activity-item');
        const img = el('img', 'activity-img');
        img.src = icon.options.iconUrl;
        img.alt = p.name;

        const info = el('div', 'activity-info');
        info.append(el('h3', null, p.name));
        info.append(el('p', null, [p.category, `${p.distance.toFixed(1)} km away`].filter(Boolean).join(' · ')));
        if (p.address) info.append(el('p', null, p.address));

        const route = el('button', 'route-button', 'Get directions');
        route.type = 'button';
        route.dataset.lat = p.lat;
        route.dataset.lng = p.lng;
        route.addEventListener('click', e => {
            e.stopPropagation();
            drawRoute(userPos || center, { lat: p.lat, lng: p.lng });
        });
        info.append(route);

        item.append(img, info);
        item.addEventListener('click', () => { map.setView([p.lat, p.lng], 16); marker.openPopup(); });
        list.append(item);
    });
}

/* ---------- routing ---------- */
function drawRoute(start, end) {
    if (routingControl) map.removeControl(routingControl);
    routingControl = L.Routing.control({
        waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
        routeWhileDragging: true,
        createMarker: () => null,
        router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1', timeout: 10000 }),
        showAlternatives: true,
        addWaypoints: false
    }).addTo(map);
}

/* ---------- filters and moods ---------- */
const FILTERS = { restaurantsFilter: 'restaurant', sportsFilter: 'sports', eventsFilter: 'events' };

function setActiveFilter(type) {
    Object.entries(FILTERS).forEach(([id, t]) => $(id).classList.toggle('active', t === type));
}

function applyFilter(type) {
    currentType = type;
    setActiveFilter(type);
    fetchActivities(activeCenter, type);       // user-added activities stay on the map
}

Object.entries(FILTERS).forEach(([id, type]) => $(id).addEventListener('click', () => applyFilter(type)));

// Registered once, so one click means one request
document.querySelectorAll('li[data-type]').forEach(li => {
    li.addEventListener('click', () => {
        currentType = li.dataset.type;
        setActiveFilter(null);
        fetchActivities(activeCenter, currentType);
        $('dropdown').checked = false;         // close the mood menu
    });
});

/* ---------- search ---------- */
async function runSearch() {
    const query = $('mapSearchInput').value.trim();
    if (!query) return;
    try {
        const place = await geocode(query);
        if (!place) { alert('Location not found'); return; }
        if (searchMarker) map.removeLayer(searchMarker);
        searchMarker = L.marker([place.lat, place.lng]).addTo(map).bindPopup(popupFor(place.label)).openPopup();
        map.setView([place.lat, place.lng], 14);
        activeCenter = { lat: place.lat, lng: place.lng };
        locationNotice = '';                   // the user chose a place, so no notice is needed
        fetchActivities(activeCenter, currentType);
    } catch (err) {
        console.error('Search error:', err);
        alert('Search failed. Please try again.');
    }
}
$('mapSearchBtn').addEventListener('click', runSearch);
$('mapSearchInput').addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(); });

/* ---------- add-activity dialog ---------- */
const modal = $('activityFormModal');
const openModal = () => { modal.style.display = 'block'; };
const closeModal = () => { modal.style.display = 'none'; };

$('addActivityBtn').addEventListener('click', openModal);
document.querySelector('.close').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

$('activityType').addEventListener('change', function () {
    $('marathonPoints').style.display = this.value === 'marathon' ? 'block' : 'none';
});

// The dialog covers the map, so hide it while the user picks a point, then bring it back
function pickOnMap(inputId, message) {
    modal.style.display = 'none';
    const hint = el('div', 'map-hint', `${message} (Esc to cancel)`);
    document.body.append(hint);

    const finish = () => {
        hint.remove();
        map.off('click', onClick);
        document.removeEventListener('keydown', onKey);
        openModal();
    };
    const onClick = e => {
        if (tempMarker) map.removeLayer(tempMarker);
        tempMarker = L.marker(e.latlng).addTo(map);
        $(inputId).value = `${e.latlng.lat.toFixed(6)},${e.latlng.lng.toFixed(6)}`;
        finish();
    };
    const onKey = e => { if (e.key === 'Escape') finish(); };
    map.on('click', onClick);
    document.addEventListener('keydown', onKey);
}
$('pickLocationBtn').addEventListener('click', () => pickOnMap('activityLocation', 'Click the map to choose the location'));
$('pickStartBtn').addEventListener('click', () => pickOnMap('startLocation', 'Click the map to choose the start'));
$('pickEndBtn').addEventListener('click', () => pickOnMap('endLocation', 'Click the map to choose the end'));

/* ---------- user-added activities (kept in this browser) ---------- */
function saveUserActivities() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userActivities.map(a => a.data))); } catch (e) { /* storage unavailable */ }
}

function addUserActivity(data, { open = false, persist = true } = {}) {
    const marker = L.marker([data.lat, data.lng], { icon: userActivityIcon }).addTo(map);
    const content = popupFor(data.name, `Type: ${data.type}`);
    const remove = el('button', 'remove-button', 'Remove');
    remove.type = 'button';
    remove.addEventListener('click', () => removeUserActivity(marker));   // listener stays on the real element
    content.append(el('br'), remove);
    marker.bindPopup(content);
    if (open) marker.openPopup();
    userActivities.push({ marker, data });
    if (persist) saveUserActivities();
}

function removeUserActivity(marker) {
    map.removeLayer(marker);
    const i = userActivities.findIndex(a => a.marker === marker);
    if (i !== -1) userActivities.splice(i, 1);
    saveUserActivities();
}

function loadUserActivities() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        saved.forEach(d => { if (typeof d.lat === 'number' && typeof d.lng === 'number') addUserActivity(d, { persist: false }); });
    } catch (e) { /* ignore corrupt data */ }
}

$('activityForm').addEventListener('submit', async event => {
    event.preventDefault();
    const name = $('activityName').value.trim();
    const type = $('activityType').value;
    const submit = $('addActivity');
    submit.disabled = true;

    try {
        const place = await geocode($('activityLocation').value.trim());
        if (!place) { alert('Location not found'); return; }
        addUserActivity({ name, type, lat: place.lat, lng: place.lng }, { open: true });

        if (type === 'marathon') {
            const start = await geocode($('startLocation').value.trim());
            const end = await geocode($('endLocation').value.trim());
            if (start && end) {
                drawRoute(start, end);
                map.fitBounds([[start.lat, start.lng], [end.lat, end.lng]], { padding: [40, 40] });
            } else {
                alert("Activity added, but the start or end location wasn't found so the route wasn't drawn.");
            }
        }

        if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
        $('activityForm').reset();
        $('marathonPoints').style.display = 'none';
        closeModal();
    } catch (err) {
        console.error('Add activity error:', err);
        alert('Something went wrong. Please try again.');
    } finally {
        submit.disabled = false;
    }
});

/* ---------- start ---------- */
$('locate-btn').addEventListener('click', () => locateUser());   // arrow function: the click event is not passed in
loadUserActivities();
locateUser();