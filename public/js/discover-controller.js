/**
 * BarCrush Discover Controller
 * 
 * Handles the discover page functionality including:
 * - Displaying nearby venues on the map
 * - Showing recommended venues
 * - User location handling
 */

import { getNearbyVenues, searchVenues } from './api/venues.js';
import { getCurrentUser, updateUserLocation } from './api/supabase-client.js';
import { getUserProfile } from './api/profiles.js';

// Map instance and markers
let map;
let userMarker;
let venueMarkers = [];
let selectedVenueId = null;

// Default location (San Francisco) - Using test coordinates from test-venues-api.html
const DEFAULT_LAT = 37.7749;
const DEFAULT_LNG = -122.4194;

// Force using default coordinates for testing
const USE_TEST_COORDINATES = true;

/**
 * Initialize the discover page
 */
async function initDiscover() {
  try {
    console.log('🚀 DISCOVER PAGE INITIALIZATION STARTED');
    
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
    
    // Get loading indicator reference
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
      console.log('🔄 Found loading indicator, keeping it visible during loading');
      loadingIndicator.style.display = 'flex';
    }
    
    // Get the user's profile
    console.log('👤 Getting current user...');
    const user = await getCurrentUser();
    if (!user) {
      console.error('❌ User not authenticated');
      return;
    }
    
    // Get user profile
    const profile = await getUserProfile(user.id);
    
    // Initialize the map with user's location
    console.log('🗺️ Initializing map with user location...');
    await initMap(profile);
    
    // Load recommended venues
    try {
      await loadRecommendedVenues();
    } catch (err) {
      console.error('Failed to load venues:', err);
      
      // Show error message
      const venuesContainer = document.getElementById('venues-container');
      if (venuesContainer) {
        venuesContainer.style.display = 'block';
        const errorMsg = document.createElement('p');
        errorMsg.className = 'error-message';
        errorMsg.textContent = 'Error loading venues. Please try again later.';
        venuesContainer.innerHTML = '';
        venuesContainer.appendChild(errorMsg);
      }
      
      // Hide loading indicator on error
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
    }
    
    // Set up event listeners
    setupEventListeners();
    
  } catch (error) {
    console.error('❌ Error initializing discover page:', error);
    
    // Hide loading indicator on error
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
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
  
  // If we're using test coordinates, skip geolocation
  if (USE_TEST_COORDINATES) {
    console.log('🧪 Using test coordinates:', DEFAULT_LAT, DEFAULT_LNG);
    
    // Set map view to test location
    map.setView([DEFAULT_LAT, DEFAULT_LNG], 15);
    
    // Add user marker at test location
    addUserMarker(DEFAULT_LAT, DEFAULT_LNG, profile?.avatar_url || '/images/avatar.jpg');
    
    // Load venues near test location
    await loadNearbyVenues(DEFAULT_LAT, DEFAULT_LNG);
    
    return;
  }
  
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
 * Using the improved approach from test-venues-api.html to prevent loading loops
 */
async function loadNearbyVenues(lat, lng) {
  try {
    console.log('🚀 loadNearbyVenues called with coordinates:', lat, lng);
    
    // Get loading indicator reference
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
      console.log('🔄 Loading indicator is visible during venue loading');
      loadingIndicator.style.display = 'flex';
    }
    
    // IMPORTANT: Delete any legacy markers first to prevent duplicates
    // First completely reset the map - remove ALL markers including user marker
    if (map) {
      map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });
      console.log('🧹 ALL map markers cleared (including legacy markers)');
    } else {
      console.error('❌ Map object is not initialized!');
    }
    
    // Re-add user marker after clearing everything
    addUserMarker(lat, lng, '/images/avatar.jpg');
    
    // Clear any tracked venue markers in our array
    clearVenueMarkers();
    
    // Get venues near the user - using direct approach from test-venues-api.html
    console.log('🔍 Fetching venues near coordinates:', lat, lng);
    
    // Use a fixed radius of 10km for consistency
    const radius = 10;
    
    try {
      console.log('Calling getNearbyVenues with:', { lat, lng, radius });
      const venues = await getNearbyVenues(lat, lng, radius);
      console.log('📍 API returned venues:', venues);
      
      // Process venues only if we have valid data
      if (venues && Array.isArray(venues) && venues.length > 0) {
        console.log(`🗺️ Adding ${venues.length} venue markers from API data`);
        
        // Add markers for each venue
        venues.forEach(venue => {
          console.log('➕ Adding venue marker for:', venue.name, venue);
          addVenueMarker(venue);
        });
        
        // Also update the venues list in the UI
        displayVenues(venues);
        
        // Hide loading indicator now that venues are loaded
        if (loadingIndicator) {
          console.log('✅ Venues loaded successfully, hiding loading indicator');
          loadingIndicator.style.display = 'none';
        }
        
        return venues;
      } else {
        console.log('❌ No venues found from the API - map will be empty');
        
        // Hide loading indicator and show no venues message
        if (loadingIndicator) {
          console.log('⚠️ No venues found, hiding loading indicator');
          loadingIndicator.style.display = 'none';
          
          // Add a message to the map
          const mapContainer = document.querySelector('.map-container');
          if (mapContainer) {
            // Remove any existing no-venues message first
            const existingMsg = mapContainer.querySelector('.no-venues-message');
            if (existingMsg) {
              existingMsg.remove();
            }
            
            const noVenuesMsg = document.createElement('div');
            noVenuesMsg.className = 'no-venues-message';
            noVenuesMsg.innerHTML = '<p>No venues found nearby.</p><p>Try again later or change your location.</p>';
            mapContainer.appendChild(noVenuesMsg);
          }
        }
        
        return [];
      }
    } catch (venueError) {
      console.error('Error fetching venues:', venueError);
      throw venueError; // Re-throw to be caught by outer try/catch
    }
  } catch (error) {
    console.error('❌ Error loading nearby venues:', error);
    
    // Hide loading indicator on error
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    
    // Show error message in the venues container
    const venuesContainer = document.getElementById('venues-container');
    if (venuesContainer) {
      venuesContainer.innerHTML = `<div class="error-message">Error loading venues: ${error.message || 'Unknown error'}</div>`;
    }
    
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
 * Display venues in the UI
 * @param {Array} venues - Array of venue objects to display
 */
function displayVenues(venues) {
  console.log(`📋 Displaying ${venues.length} venues in UI`);
  
  // Create venue cards
  const container = document.getElementById('venues-container');
  if (!container) {
    console.error('❌ Venues container not found');
    return;
  }
  
  container.innerHTML = ''; // Clear existing content
  
  if (venues.length === 0) {
    console.log('⚠️ No venues to display');
    const noVenuesMsg = document.createElement('p');
    noVenuesMsg.className = 'no-venues-message';
    noVenuesMsg.textContent = 'No venues found nearby. Try again later.';
    container.appendChild(noVenuesMsg);
    return;
  }
  
  venues.forEach(venue => {
    console.log(`🏢 Creating card for venue: ${venue.name}`);
    const venueCard = createVenueCard(venue);
    container.appendChild(venueCard);
  });
  
  console.log('✅ Venues displayed successfully');
}

/**
 * Load recommended venues in the top section
 */
async function loadRecommendedVenues() {
  try {
    console.log('🔍 Loading recommended venues from API...');
    
    // Show loading indicator
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'flex';
    }
    
    const venuesContainer = document.getElementById('venues-container');
    if (venuesContainer) {
      venuesContainer.style.display = 'none';
    }
    
    const userLat = userMarker ? userMarker.getLatLng().lat : DEFAULT_LAT;
    const userLng = userMarker ? userMarker.getLatLng().lng : DEFAULT_LNG;
    
    console.log(`📍 Using coordinates: ${userLat}, ${userLng}`);
    
    // Get venues near the user
    console.log('🌎 Calling getNearbyVenues API...');
    const venues = await getNearbyVenues(userLat, userLng, 20); // 20km radius
    console.log(`📊 API returned ${venues ? venues.length : 0} venues`);
    
    // Hide loading indicator
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    
    if (venuesContainer) {
      venuesContainer.style.display = 'block';
    }
    
    if (!venues || venues.length === 0) {
      console.log('⚠️ No venues returned from API');
      // Show no venues message
      if (venuesContainer) {
        const noVenuesMsg = document.createElement('p');
        noVenuesMsg.className = 'no-venues-message';
        noVenuesMsg.textContent = 'No venues found nearby. Try again later.';
        venuesContainer.innerHTML = '';
        venuesContainer.appendChild(noVenuesMsg);
      }
      throw new Error('No venues found'); // Throw error to trigger fallback
    }
    
    // Sort by rating
    const recommended = venues
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5); // Top 5
    
    console.log(`⭐ Found ${recommended.length} recommended venues`);
    
    // Display the venues
    displayVenues(recommended);
    
    return recommended;
  } catch (error) {
    console.error('❌ Error loading recommended venues:', error);
    
    // Hide loading indicator on error
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    
    const venuesContainer = document.getElementById('venues-container');
    if (venuesContainer) {
      venuesContainer.style.display = 'block';
      // Show error message
      const errorMsg = document.createElement('p');
      errorMsg.className = 'error-message';
      errorMsg.textContent = 'Error loading venues. Please try again later.';
      venuesContainer.innerHTML = '';
      venuesContainer.appendChild(errorMsg);
    }
    
    // Re-throw the error so the calling function can handle it
    throw error;
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
  
  // Handle different venue location data structures
  let venueLat, venueLng;
  
  if (venue.location && venue.location.coordinates) {
    // PostGIS point format
    venueLat = venue.location.coordinates[1];
    venueLng = venue.location.coordinates[0];
  } else if (venue.location_lat && venue.location_lng) {
    // Separate lat/lng fields
    venueLat = venue.location_lat;
    venueLng = venue.location_lng;
  } else if (venue.lat && venue.lng) {
    // Simple lat/lng fields (mock data)
    venueLat = venue.lat;
    venueLng = venue.lng;
  } else {
    // Fallback to default location
    console.warn('Venue missing location data:', venue.name);
    venueLat = DEFAULT_LAT;
    venueLng = DEFAULT_LNG;
  }
  
  // Calculate distance
  const distance = calculateDistance(userLat, userLng, venueLat, venueLng);
  
  // Use actual number of active users from API data
  const peopleCount = venue.active_users || 0;
  
  // Get venue image
  let venueImage = '/images/venue-placeholder.jpg';
  if (venue.images && venue.images.length > 0) {
    venueImage = venue.images[0];
  } else if (venue.image_url) {
    venueImage = venue.image_url;
  }
  
  // Add venue name and details
  card.innerHTML = `
    <img src="${venueImage}" alt="${venue.name}" class="venue-image">
    <div class="venue-info">
      <h3 class="venue-name">${venue.name}</h3>
      <p class="venue-description">${venue.description || 'Visit this venue'}</p>
    </div>
    <div class="venue-stats">
      <div class="people-badge">${peopleCount} people</div>
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
  
  // Filter button and modal functionality
  const filterBtn = document.querySelector('.filter-btn');
  const filterModal = document.getElementById('filter-modal');
  const closeFilterBtn = document.getElementById('close-filter-modal');
  const applyFiltersBtn = document.getElementById('apply-filters');
  const clearFiltersBtn = document.getElementById('clear-filters');
  
  // Filter state object
  const filterState = {
    gender: 'all',
    location: null,
    distance: 10,
    minAge: 18,
    maxAge: 65
  };
  
  if (filterBtn && filterModal) {
    // Open filter modal
    filterBtn.addEventListener('click', () => {
      filterModal.style.display = 'block';
      document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    });
    
    // Close filter modal
    closeFilterBtn.addEventListener('click', () => {
      filterModal.style.display = 'none';
      document.body.style.overflow = '';
    });
    
    // Close modal when clicking outside
    filterModal.addEventListener('click', (e) => {
      if (e.target === filterModal) {
        filterModal.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
    
    // Gender filter options
    const genderOptions = document.querySelectorAll('.filter-option[data-filter="gender"]');
    genderOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove active class from all options
        genderOptions.forEach(opt => opt.classList.remove('active'));
        // Add active class to selected option
        option.classList.add('active');
        // Update filter state
        filterState.gender = option.dataset.value;
      });
      
      // Set initial active state
      if (option.dataset.value === filterState.gender) {
        option.classList.add('active');
      }
    });
    
    // Distance slider
    const distanceSlider = document.getElementById('distance-slider');
    const distanceValue = document.getElementById('distance-value');
    
    if (distanceSlider && distanceValue) {
      distanceSlider.value = filterState.distance;
      distanceValue.textContent = filterState.distance;
      
      distanceSlider.addEventListener('input', () => {
        const value = distanceSlider.value;
        distanceValue.textContent = value;
        filterState.distance = parseInt(value, 10);
      });
    }
    
    // Age sliders
    const minAgeSlider = document.getElementById('min-age-slider');
    const maxAgeSlider = document.getElementById('max-age-slider');
    const minAgeValue = document.getElementById('min-age-value');
    const maxAgeValue = document.getElementById('max-age-value');
    
    if (minAgeSlider && maxAgeSlider && minAgeValue && maxAgeValue) {
      minAgeSlider.value = filterState.minAge;
      maxAgeSlider.value = filterState.maxAge;
      minAgeValue.textContent = filterState.minAge;
      maxAgeValue.textContent = filterState.maxAge;
      
      minAgeSlider.addEventListener('input', () => {
        const minVal = parseInt(minAgeSlider.value, 10);
        const maxVal = parseInt(maxAgeSlider.value, 10);
        
        if (minVal > maxVal) {
          minAgeSlider.value = maxVal;
          filterState.minAge = maxVal;
        } else {
          filterState.minAge = minVal;
        }
        
        minAgeValue.textContent = filterState.minAge;
      });
      
      maxAgeSlider.addEventListener('input', () => {
        const minVal = parseInt(minAgeSlider.value, 10);
        const maxVal = parseInt(maxAgeSlider.value, 10);
        
        if (maxVal < minVal) {
          maxAgeSlider.value = minVal;
          filterState.maxAge = minVal;
        } else {
          filterState.maxAge = maxVal;
        }
        
        maxAgeValue.textContent = filterState.maxAge;
      });
    }
    
    // Location input and current location button
    const locationInput = document.getElementById('location-filter');
    const useCurrentLocationBtn = document.getElementById('use-current-location');
    
    if (locationInput && useCurrentLocationBtn) {
      useCurrentLocationBtn.addEventListener('click', async () => {
        try {
          const position = await getCurrentPosition();
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Set location in filter state
          filterState.location = { lat, lng };
          locationInput.value = 'Current Location';
          locationInput.disabled = true;
          
          console.log('Using current location for filter:', { lat, lng });
        } catch (error) {
          console.error('Error getting current location:', error);
          alert('Could not get your current location. Please check your browser permissions.');
        }
      });
      
      locationInput.addEventListener('input', () => {
        // If user types in location input, clear the current location coordinates
        if (locationInput.value && locationInput.value !== 'Current Location') {
          filterState.location = null;
          locationInput.disabled = false;
        }
      });
    }
    
    // Apply filters
    applyFiltersBtn.addEventListener('click', () => {
      console.log('Applying filters:', filterState);
      
      // Get user's current location
      const userLat = userMarker ? userMarker.getLatLng().lat : DEFAULT_LAT;
      const userLng = userMarker ? userMarker.getLatLng().lng : DEFAULT_LNG;
      
      // Use filter location or user location
      const searchLat = filterState.location ? filterState.location.lat : userLat;
      const searchLng = filterState.location ? filterState.location.lng : userLng;
      
      // Apply filters and reload venues
      loadNearbyVenues(searchLat, searchLng, filterState.distance, {
        gender: filterState.gender,
        minAge: filterState.minAge,
        maxAge: filterState.maxAge
      });
      
      // Close modal
      filterModal.style.display = 'none';
      document.body.style.overflow = '';
    });
    
    // Clear filters
    clearFiltersBtn.addEventListener('click', () => {
      // Reset filter state
      filterState.gender = 'all';
      filterState.location = null;
      filterState.distance = 10;
      filterState.minAge = 18;
      filterState.maxAge = 65;
      
      // Reset UI
      genderOptions.forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.value === 'all') {
          opt.classList.add('active');
        }
      });
      
      distanceSlider.value = 10;
      distanceValue.textContent = '10';
      
      minAgeSlider.value = 18;
      maxAgeSlider.value = 65;
      minAgeValue.textContent = '18';
      maxAgeValue.textContent = '65';
      
      locationInput.value = '';
      locationInput.disabled = false;
      
      console.log('Filters cleared');
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
