/**
 * BarCrush Discover Controller
 * 
 * Handles the discover page functionality including:
 * - Displaying nearby venues on the map
 * - Showing recommended venues
 * - User location handling
 */

import { getNearbyVenues, searchVenuesByName } from './api/venues.js';
import { getCurrentUser, updateUserLocation } from './api/supabase-client.js';
import { getUserProfile } from './api/profiles.js';

// Map instance and markers
let map;
let userMarker;
let venueMarkers = [];
let selectedVenueId = null;

// Default location (San Francisco)
const DEFAULT_LAT = 37.7749;
const DEFAULT_LNG = -122.4194;

/**
 * Initialize the discover page
 */
async function initDiscover() {
  try {
    // EMERGENCY CLEANUP: Remove ALL mock data flags to ensure we only use real data
    localStorage.removeItem('useMockVenues');
    localStorage.removeItem('useMockData');
    localStorage.removeItem('useTestData');
    localStorage.removeItem('debugMode');
    localStorage.removeItem('devMode');
    // Also clear any map data that might be cached
    sessionStorage.removeItem('mapData');
    sessionStorage.removeItem('venueMarkers');
    sessionStorage.removeItem('mapMarkers');
    
    console.log('🔥 PURGED ALL MOCK DATA FLAGS - Using REAL API data ONLY');
    
    // Get the user's profile
    const user = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      window.location.href = '/views/login.html';
      return;
    }

    const profile = await getUserProfile(user.id);
    
    // Initialize the map (with no markers initially)
    initMap(profile);
    
    // Load recommended venues
    loadRecommendedVenues();
    
    // Set up UI event listeners
    setupEventListeners();
    
    console.log('💯 Discover page initialized with REAL DATA ONLY');
  } catch (error) {
    console.error('Error initializing discover page:', error);
  }
}

/**
 * Initialize the map with user's location
 */
async function initMap(profile) {
  // Initialize Leaflet map without initial view (will set after we get location)
  map = L.map('map');
  
  // Use Mapbox with theme support
  const isLightTheme = document.documentElement.getAttribute('data-theme') !== 'dark';
  
  // Mapbox access token - public token for demo purposes
  const mapboxToken = 'pk.eyJ1IjoiYmFyY3J1c2giLCJhIjoiY2t6eHZtdXFvMDIxcjJ4bXUxbXV6YnZ6ZSJ9.q7XfDPH9-76LZ2rTGzRNHQ';
  
  // Choose style based on theme
  const mapboxStyle = isLightTheme 
    ? 'mapbox/light-v10'  // Light theme
    : 'mapbox/dark-v10';  // Dark theme
  
  L.tileLayer(`https://api.mapbox.com/styles/v1/${mapboxStyle}/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`, {
    tileSize: 512,
    zoomOffset: -1,
    maxZoom: 19,
    attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  
  // Reset map variables
  userMarker = null;
  venueMarkers = [];
  
  console.log('🌎 Getting user location...');
  
  // First priority: Try to get current position with browser geolocation
  try {
    console.log('📍 Requesting current user position...');
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });
    
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    
    console.log(`✅ Got user location: ${userLat}, ${userLng}`);
    
    // Set map view to user location
    map.setView([userLat, userLng], 15);
    
    // Update user's location in the database
    await updateUserLocation(userLat, userLng);
    
    // Add user marker
    addUserMarker(userLat, userLng, profile?.avatar_url || '/images/avatar.jpg');
    
    // Load venues near this location
    await loadNearbyVenues(userLat, userLng);
    
    return;
  } catch (geoError) {
    console.warn('📍 Could not get current location:', geoError);
  }
  
  // Second priority: Use profile location if available
  if (profile && profile.location_lat && profile.location_lng) {
    console.log('📌 Using profile location');
    const userLat = profile.location_lat;
    const userLng = profile.location_lng;
    
    map.setView([userLat, userLng], 15);
    addUserMarker(userLat, userLng, profile.avatar_url || '/images/avatar.jpg');
    await loadNearbyVenues(userLat, userLng);
    return;
  }
  
  // Fallback: Use default location
  console.log('🏙️ Using default location');
  const defaultLat = DEFAULT_LAT;
  const defaultLng = DEFAULT_LNG;
  
  // Center map on default location
  map.setView([defaultLat, defaultLng], 13);
  
  // Add user marker at default location
  addUserMarker(defaultLat, defaultLng, profile?.avatar_url || '/images/avatar.jpg');
  
  // Load nearby venues at default location
  await loadNearbyVenues(defaultLat, defaultLng);
}

/**
 * Add a user marker to the map
 */
function addUserMarker(lat, lng, avatarUrl) {
  // Remove existing user marker if present
  if (userMarker) {
    map.removeLayer(userMarker);
  }
  
  // Create a simple div-based marker
  const userIcon = L.divIcon({
    className: 'simple-user-marker',
    html: '👤', // 👤 emoji
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
  
  // Create marker with the div icon
  userMarker = L.marker([lat, lng], {
    icon: userIcon, 
    zIndexOffset: 1000
  }).addTo(map);
  
  // Add pulsing effect
  const markerElement = userMarker.getElement();
  if (markerElement) {
    markerElement.classList.add('pulsing');
  }
  
  return userMarker;
}

/**
 * Load nearby venues on the map
 */
async function loadNearbyVenues(lat, lng) {
  try {
    // IMPORTANT: Delete any legacy markers first to prevent duplicates
    // First completely reset the map - remove ALL markers including user marker
    if (map) {
      map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });
      console.log('🧹 ALL map markers cleared (including legacy markers)');
    }
    
    // Re-add user marker after clearing everything
    addUserMarker(lat, lng, '/images/avatar.jpg');
    
    // Clear any tracked venue markers in our array
    clearVenueMarkers();
    
    // Get venues near the user
    console.log('🔍 Fetching venues near coordinates:', lat, lng);
    const venues = await getNearbyVenues(lat, lng, 10); // 10km radius
    console.log('📍 API returned venues:', venues);
    
    // Add markers for each venue - ONLY from API data
    if (venues && venues.length > 0) {
      console.log(`🗺️ Adding ${venues.length} venue markers from API data ONLY`);
      venues.forEach(venue => {
        console.log('➕ Adding venue marker for:', venue.name, venue);
        addVenueMarker(venue);
      });
    } else {
      console.log('❌ No venues found from the API - map will be empty');
    }
    
    return venues;
  } catch (error) {
    console.error('Error loading nearby venues:', error);
    return [];
  }
}

/**
 * Add venue marker to the map
 */
function addVenueMarker(venue) {
  // Get venue coordinates
  const lat = venue.location_lat || (venue.location?.coordinates ? venue.location.coordinates[1] : 0);
  const lng = venue.location_lng || (venue.location?.coordinates ? venue.location.coordinates[0] : 0);
  
  if (!lat || !lng) {
    console.warn(' Venue missing coordinates:', venue);
    return null;
  }
  
  console.log(` Adding venue marker: ${venue.name} at ${lat}, ${lng}`);
  
  // Create simple div-based marker with emoji
  const venueIcon = L.divIcon({
    className: 'simple-venue-marker',
    html: '🍸', // Cocktail emoji representing a venue
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
  
  // Create marker with venue data
  const marker = L.marker([lat, lng], {icon: venueIcon}).addTo(map);
  
  // Add popup with venue info
  marker.bindPopup(`
    <div class="venue-popup">
      <h3>${venue.name}</h3>
      <p>${venue.description || 'Visit this venue to meet new people!'}</p>
      <p><strong>Address:</strong> ${venue.address || 'Address not available'}</p>
    </div>
  `);
  
  // Store marker for later reference
  venueMarkers.push(marker);
  
  return marker;
}

/**
 * Clear all venue markers from the map
 */
function clearVenueMarkers() {
  venueMarkers.forEach(marker => {
    map.removeLayer(marker);
  });
  venueMarkers = [];
}

/**
 * Select a venue on the map
 */
function selectVenue(venue) {
  selectedVenueId = venue.id;
  
  // Update connect button
  const connectBtn = document.querySelector('.connect-btn');
  const peopleCount = document.querySelector('.people-count');
  
  // Show actual number of active users at the venue
  peopleCount.textContent = venue.active_users || 0;
  
  connectBtn.style.display = 'block';
  connectBtn.onclick = () => {
    window.location.href = `/views/matching.html?venueId=${venue.id}`;
  };
}

/**
 * Load recommended venues in the top section
 */
async function loadRecommendedVenues() {
  try {
    const userLat = userMarker ? userMarker.getLatLng().lat : DEFAULT_LAT;
    const userLng = userMarker ? userMarker.getLatLng().lng : DEFAULT_LNG;
    
    // Get venues near the user
    const venues = await getNearbyVenues(userLat, userLng, 20); // 20km radius
    
    // Sort by rating
    const recommended = venues
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5); // Top 5
      
    // Create venue cards
    const container = document.getElementById('venues-container');
    if (!container) return;
    
    container.innerHTML = ''; // Clear existing content
    
    recommended.forEach(venue => {
      const venueCard = createVenueCard(venue);
      container.appendChild(venueCard);
    });
  } catch (error) {
    console.error('Error loading recommended venues:', error);
  }
}

/**
 * Create a venue card element
 */
function createVenueCard(venue) {
  const card = document.createElement('div');
  card.className = 'venue-card';
  card.onclick = () => {
    // Navigate to venue detail page
    window.location.href = `/views/venue-detail.html?id=${venue.id}`;
  };
  
  // Calculate distance (for demo purposes)
  const userLat = userMarker ? userMarker.getLatLng().lat : DEFAULT_LAT;
  const userLng = userMarker ? userMarker.getLatLng().lng : DEFAULT_LNG;
  
  const venueLat = venue.location ? venue.location.coordinates[1] : venue.location_lat;
  const venueLng = venue.location ? venue.location.coordinates[0] : venue.location_lng;
  
  const distance = calculateDistance(userLat, userLng, venueLat, venueLng);
  
  // Use actual number of active users from API data
  const peopleCount = venue.active_users || 0;
  
  card.innerHTML = `
    <img src="${venue.images && venue.images.length > 0 ? venue.images[0] : '/images/venue-placeholder.jpg'}" 
      alt="${venue.name}" 
      class="venue-image">
    <div class="people-badge">${peopleCount} people</div>
    <div class="venue-details">
      <div class="distance-badge">${distance.toFixed(1)} km away</div>
    </div>
  `;
  
  return card;
}

/**
 * Calculate distance between two points in km
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

/**
 * Get current position as a promise
 */
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  });
}

/**
 * Set up event listeners for UI elements
 */
function setupEventListeners() {
  // Map zoom controls
  document.querySelector('.zoom-in-btn').addEventListener('click', () => {
    map.setZoom(map.getZoom() + 1);
  });
  
  document.querySelector('.zoom-out-btn').addEventListener('click', () => {
    map.setZoom(map.getZoom() - 1);
  });
  
  // Filter button
  const filterBtn = document.querySelector('.filter-btn');
  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      alert('Filter functionality coming soon!');
    });
  }
  
  // Theme change listener
  document.addEventListener('themeChanged', async (e) => {
    const isLightTheme = e.detail.theme !== 'dark';
    
    // Update map tiles
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });
    
    const tileUrl = isLightTheme 
      ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png'
      : 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
    
    L.tileLayer(tileUrl, {
      maxZoom: 20,
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initDiscover);

// Export functions for external use
export { initDiscover, loadNearbyVenues };
