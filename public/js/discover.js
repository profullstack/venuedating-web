/**
 * discover.js
 * Manages the discover page functionality including venues, map, and navigation
 */

import { getNearbyVenues } from './api/venues.js';
import { getCurrentUser } from './api/supabase-client.js';

// Default locations for different venue areas
const VENUE_LOCATIONS = {
  'sanfrancisco': { lat: 37.7749, lng: -122.4194, name: 'San Francisco, CA' }
};

// Use the San Francisco location as fallback only
const DEFAULT_LOCATION = VENUE_LOCATIONS.sanfrancisco;
const USE_TEST_COORDINATES = false; // Set to false to use real device geolocation
const ENABLE_VENUE_IMAGES = false; // Feature flag: set to true to show venue images

// Map and markers
let map;
let userMarker;
let venueMarkers = [];

export async function initDiscoverPage() {
  console.log('Initialize discover page');
  setupHeaderButtons();
  setupVenueCards();
  await setupMapElements();
  setupBottomNavigation();
}

/**
 * Set up header button interactions
 */
function setupHeaderButtons() {
  const searchBtn = document.querySelector('.discover-search-button');
  const filterBtn = document.querySelector('.discover-filter-button');
  const notificationBtn = document.querySelector('.discover-notification-button');
  
  if (searchBtn) {
    searchBtn.addEventListener('click', function() {
      console.log('Search button clicked');
      // Show location selector
      showLocationSelector();
    });
  }
  
  if (filterBtn) {
    filterBtn.addEventListener('click', function() {
      console.log('Filter button clicked');
      // TODO: Implement filter functionality
    });
  }
  
  if (notificationBtn) {
    notificationBtn.addEventListener('click', function() {
      console.log('Notification button clicked');
      // TODO: Implement notification functionality
    });
  }
}

/**
 * Show location selector modal
 */
function showLocationSelector() {
  // Create modal container if it doesn't exist
  let locationModal = document.getElementById('location-selector-modal');
  
  if (!locationModal) {
    locationModal = document.createElement('div');
    locationModal.id = 'location-selector-modal';
    locationModal.className = 'modal';
    locationModal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); z-index: 1000; display: flex; justify-content: center; align-items: center;';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = 'background-color: white; padding: 20px; border-radius: 12px; width: 80%; max-width: 400px;';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;';
    
    const modalTitle = document.createElement('h3');
    modalTitle.textContent = 'Select Location';
    modalTitle.style.margin = '0';
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = 'background: none; border: none; font-size: 24px; cursor: pointer;';
    closeButton.onclick = () => locationModal.style.display = 'none';
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    const locationList = document.createElement('div');
    locationList.className = 'location-list';
    locationList.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';
    
    // Add location options
    Object.entries(VENUE_LOCATIONS).forEach(([key, location]) => {
      const locationOption = document.createElement('div');
      locationOption.className = 'location-option';
      locationOption.style.cssText = 'padding: 15px; border-radius: 8px; background-color: #f5f5f5; cursor: pointer; display: flex; justify-content: space-between; align-items: center;';
      locationOption.dataset.location = key;
      
      const locationName = document.createElement('span');
      locationName.textContent = location.name;
      locationName.style.fontWeight = 'bold';
      
      const locationIcon = document.createElement('span');
      locationIcon.innerHTML = '&#10148;';
      
      locationOption.appendChild(locationName);
      locationOption.appendChild(locationIcon);
      
      locationOption.addEventListener('click', () => {
        // Set the selected location and reload
        localStorage.setItem('preferredLocation', key);
        window.location.href = `?location=${key}`;
        locationModal.style.display = 'none';
      });
      
      locationList.appendChild(locationOption);
    });
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(locationList);
    locationModal.appendChild(modalContent);
    document.body.appendChild(locationModal);
  }
  
  // Show the modal
  locationModal.style.display = 'flex';
}

/**
 * Set up venue card interactions
 */
function setupVenueCards() {
  const venueCards = document.querySelectorAll('.venue-card');
  
  venueCards.forEach(card => {
    card.addEventListener('click', function() {
      const venueName = card.querySelector('.venue-name')?.textContent;
      console.log('Venue card clicked:', venueName);
      // TODO: Navigate to venue details or show venue info
    });
  });
}

/**
 * Set up map and related elements
 */
async function setupMapElements() {
  console.log('🗺️ Setting up map elements...');
  
  // Initialize variables
  let userMarker = null;
  let venueMarkers = [];
  let activeVenue = null;
  
  // Show loading indicator
  const loadingIndicator = document.querySelector('.loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'flex';
  }
  
  // Initialize Leaflet map
  const mapElement = document.getElementById('map');
  if (!mapElement) {
    console.error('❌ Map element not found!');
    return;
  }
  
  // Get the selected location from URL or localStorage, or use default
  const urlParams = new URLSearchParams(window.location.search);
  const locationParam = urlParams.get('location');
  const savedLocation = localStorage.getItem('preferredLocation');
  
  // Determine which location to use
  let selectedLocation = DEFAULT_LOCATION;
  
  if (locationParam && VENUE_LOCATIONS[locationParam]) {
    // Use location from URL parameter if valid
    selectedLocation = VENUE_LOCATIONS[locationParam];
    localStorage.setItem('preferredLocation', locationParam);
  } else if (savedLocation && VENUE_LOCATIONS[savedLocation]) {
    // Use saved location preference if valid
    selectedLocation = VENUE_LOCATIONS[savedLocation];
  }
  
  // User location - using selected venue location for reliable testing
  let userLat = selectedLocation.lat;
  let userLng = selectedLocation.lng;
  
  // If not using test coordinates, try to get user's actual location
  if (!USE_TEST_COORDINATES) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
      
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;
      console.log('📍 Got user location:', userLat, userLng);
    } catch (error) {
      console.warn('⚠️ Could not get user location, using selected venue location:', error);
      // Continue with selected venue location
    }
  } else {
    console.log(`🧪 Using ${selectedLocation.name} coordinates:`, selectedLocation.lat, selectedLocation.lng);
  }
  
  // User coordinates array for the map
  const userCoords = [userLat, userLng];
  
  // Initialize the map centered at user location
  const map = L.map('map', {
    center: userCoords,
    zoom: 13, // Zoomed out to show venues within 5km radius
    zoomControl: false // We'll use custom zoom controls
  });
  
  // Determine if dark mode is active
  const isDarkMode = document.documentElement.classList.contains('dark-theme');
  
  // Select appropriate tile layer based on theme
  let tileLayer;
  if (isDarkMode) {
    // Dark mode map tiles (Stadia Maps Dark)
    tileLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    });
  } else {
    // Light mode map tiles (OpenStreetMap)
    tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    });
  }
  
  // Add the selected tile layer to the map
  tileLayer.addTo(map);
  
  // Listen for theme changes to update the map
  document.addEventListener('themeChanged', function(e) {
    const isDarkMode = e.detail.theme === 'dark';
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });
    
    if (isDarkMode) {
      L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
    }
  });
  
  // Get templates
  const venueMarkerTemplate = document.getElementById('venue-marker-template');
  const userMarkerTemplate = document.getElementById('user-marker-template');
  
  // Check if templates exist
  if (!venueMarkerTemplate || !userMarkerTemplate) {
    console.error('Map marker templates not found. Make sure venue-marker-template and user-marker-template exist in the HTML.');
    return;
  }
  
  // Define user marker function
  function addUserMarker(lat, lng, avatarUrl) {
    // Get the user marker template
    const userMarkerTemplate = document.getElementById('user-marker-template');
    if (!userMarkerTemplate) {
      console.error('User marker template not found');
      return;
    }
    
    // Clone the template
    const markerSvg = userMarkerTemplate.content.cloneNode(true);
    
    // Set the user avatar image
    const imgElement = markerSvg.querySelector('img');
    if (imgElement) {
      imgElement.src = avatarUrl || '/images/avatar.jpg';
      imgElement.alt = 'Your location';
    }
    
    // Get the marker icon HTML
    const markerIconElement = markerSvg.querySelector('.user-marker-icon');
    if (!markerIconElement) {
      console.error('User marker icon element not found in template');
      return;
    }
    
    // Create a marker for the user
    const userIcon = L.divIcon({
      className: 'custom-div-icon',
      html: markerIconElement.outerHTML,
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });
    
    // Add the marker to the map
    userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
  }
  
  // Add user marker to the map
  addUserMarker(userLat, userLng, '/images/avatar.jpg');
  
  /**
   * Display venues in the UI
   * @param {Array} venues - Array of venue objects
   */
  function displayVenues(venues) {
    // Get the venues container
    const venuesContainer = document.getElementById('venues-container');
    if (!venuesContainer) {
      console.error('Venues container not found');
      return;
    }
    
    // Clear existing venues
    venuesContainer.innerHTML = '';
    
    // Create venue cards
    venues.forEach(venue => {
      // Skip venues without valid data
      if (!venue.name) {
        console.warn('Skipping venue with missing name:', venue);
        return;
      }
      
      // Create venue card
      const venueCard = document.createElement('div');
      venueCard.className = 'venue-card';
      venueCard.dataset.venueId = venue.id;
      
      // Add click event to focus on map
      venueCard.addEventListener('click', () => {
        if (venue.coords) {
          map.setView(venue.coords, 17);
          // Find and activate the marker for this venue
          venueMarkers.forEach(marker => {
            if (marker.options.venueId === venue.id) {
              handleVenueMarkerClick(venue, marker);
            }
          });
        }
      });
      
      // Create card content
      const distance = venue.distance_km ? `${venue.distance_km.toFixed(1)} km away` : '';
      const peopleCount = venue.people_count !== undefined ? venue.people_count : 0;
      const peopleText = peopleCount === 0 ? 'Be the first here' : `${peopleCount} people`;
      
      // Generate a venue name if none exists
      const venueName = venue.name || `Venue ${venue.id || Math.floor(Math.random() * 1000)}`;
      
      // For demo purposes, use placeholder images that look like bars/venues
      const demoImages = [
        '/images/venue-placeholder.jpg',
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80', // Bar
        'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80', // Club
        'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'  // Music venue
      ];
      
      const imageIndex = venue.id ? (parseInt(venue.id, 16) % demoImages.length) : Math.floor(Math.random() * demoImages.length);
      const venueImage = venue.image_url || demoImages[imageIndex];
      
      // Create card structure to match the beautiful screenshot design
      const imageHTML = ENABLE_VENUE_IMAGES ? `<img src="${venueImage}" alt="${venueName}" class="venue-image">` : '';
      venueCard.innerHTML = `
        ${imageHTML}
        <div class="people-badge">${peopleText}</div>
        <div class="venue-details">
          <div class="distance-badge">${distance}</div>
          <h3 class="venue-name">${venueName}</h3>
        </div>
      `;
      
      // Add the card to the container
      venuesContainer.appendChild(venueCard);
    });
  }
  
  // Fetch venues from API
  try {
    console.log('🔍 Fetching nearby venues...');
    const radius = 10; // 10km radius
    let venues = await getNearbyVenues(userLat, userLng, radius);
    
    console.log('🍸 Found venues:', venues.length);
    
    // Filter venues to only include those with valid geolocation data
    venues = venues.filter(venue => venue.lat && venue.lng);
    console.log('🗺️ Valid venues with geolocation:', venues.length);
    
    // Hide loading indicator when done
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    
    // Check if we have venues to display
    if (venues.length === 0) {
      // No venues found, show empty state message
      const venuesContainer = document.getElementById('venues-container');
      if (venuesContainer) {
        venuesContainer.innerHTML = `
          <div class="empty-venues-message" style="text-align: center; padding: 40px 20px; color: #666;">
            <div style="font-size: 48px; margin-bottom: 15px;">😢</div>
            <h3 style="margin-bottom: 10px; font-size: 20px;">No Venues Found</h3>
            <p style="font-size: 16px; line-height: 1.5;">We couldn't find any venues near your current location.<br>Try changing your location or increasing the search radius.</p>
          </div>
        `;
        
        // Add event listener to the change location button
        const changeLocationBtn = venuesContainer.querySelector('.change-location-btn');
        if (changeLocationBtn) {
          changeLocationBtn.addEventListener('click', () => {
            showLocationSelector();
          });
        }
      }
    } else {
      // Display venues in the UI
      displayVenues(venues);
    }
    
    // Create and add venue markers
    venueMarkers = [];
    let activeVenue = null;
    
    venues.forEach(venue => {
      try {
        // Check if venue has valid coordinates
        if (!venue.lat || !venue.lng) {
          console.warn(`Venue ${venue.name || 'unknown'} has invalid coordinates:`, venue);
          return; // Skip this venue
        }
        
        // Use lat/lng from API response
        venue.coords = [venue.lat, venue.lng];
        
        // Add random people count for demo if not present
        
        // Create a custom marker for this venue with people count
        // Use the real people_count from the API (including 0 values)
        const peopleCount = venue.people_count !== undefined ? venue.people_count : 0;
        
        console.log(`🏢 Venue ${venue.name}: people_count = ${venue.people_count}, using = ${peopleCount}`);
        
        // Create people count text
        const peopleText = peopleCount === 0 ? 'Be the first at this venue' : `${peopleCount} people here`;
      
        // For demo purposes, use placeholder images that look like bars/venues if no image
        const demoImages = [
          '/images/venue-placeholder.jpg',
          'https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80', // Bar
          'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80', // Club
          'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'  // Music venue
        ];
      
        const imageIndex = venue.id ? (parseInt(venue.id, 16) % demoImages.length) : Math.floor(Math.random() * demoImages.length);
        const venueImage = venue.image_url || demoImages[imageIndex];
        
        // Create a custom HTML marker with connect button and circular image
        const markerHtml = `
          <div class="venue-marker-container" style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div class="connect-button" style="background-color: #ff4d79; color: white; padding: 10px 18px; border-radius: 50px; font-weight: bold; text-align: center; margin-bottom: 12px; white-space: nowrap; box-shadow: 0 4px 12px rgba(255,77,121,0.4); cursor: pointer; font-size: 13px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);" onclick="(function(e) { e.stopPropagation(); alert('${peopleCount === 0 ? 'Be the first to connect at' : 'Connecting with ' + peopleCount + ' people at'} ${venue.name || 'this venue'}...'); })(event)">
              ${peopleText}
            </div>
            <div class="venue-marker-circle" style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden; border: 4px solid #ff4d79; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
              <img src="${venueImage}" alt="${venue.name || 'Venue'}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="venue-name" style="position: absolute; bottom: -30px; text-align: center; color: #ff4d79; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 15px; white-space: nowrap; background: rgba(255,255,255,0.9); padding: 4px 8px; border-radius: 8px;">
              ${venue.name || 'Venue'}
            </div>
          </div>
        `;
      
        // Create a custom icon for the marker
        const venueIcon = L.divIcon({
          className: 'custom-venue-marker',
          html: markerHtml,
          iconSize: [200, 130], // Larger size to accommodate the connect button and image
          iconAnchor: [100, 65]  // Center anchor point
        });
        
        // Add the marker to the map
        const marker = L.marker(venue.coords, { 
          icon: venueIcon,
          venueId: venue.id // Store venue ID for later reference
        }).addTo(map);
      
        // Add popup with venue info
        marker.bindPopup(`
          <div class="venue-popup" style="text-align: center;">
            <h3 style="margin: 5px 0; font-size: 18px;">${venue.name || 'Unnamed Venue'}</h3>
            <p style="margin: 5px 0; color: #666;">${venue.address || 'No address available'}</p>
            <div style="margin: 10px 0;">
              <span style="background-color: #ff4d79; color: white; padding: 8px 14px; border-radius: 20px; font-size: 14px; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                ${peopleText}
              </span>
            </div>
            <button class="popup-connect-btn" style="background-color: #ff4d79; color: white; border: none; padding: 8px 16px; border-radius: 20px; margin-top: 10px; cursor: pointer;">
              Connect
            </button>
          </div>
        `);
      
        // Add click handler for the connect button in the marker
        marker.on('popupopen', () => {
          setTimeout(() => {
            const connectBtn = document.querySelector('.popup-connect-btn');
            if (connectBtn) {
              connectBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                alert(`${peopleCount === 0 ? 'Be the first to connect at' : 'Connecting with ' + peopleCount + ' people at'} ${venue.name || 'this venue'}...`);
              });
            }
          }, 10);
        });
        
        // Store the marker reference
        venueMarkers.push(marker);
        
        // Add click handler for marker
        marker.on('click', () => {
          // Call the venue marker click handler
          handleVenueMarkerClick(venue, marker);
        });
        
      } catch (error) {
        console.error(`Error creating marker for venue ${venue.name || 'unknown'}:`, error);
      }
    });
  } catch (error) {
    console.error('Error loading venues:', error);
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    const venuesContainer = document.getElementById('venues-container');
    if (venuesContainer) {
      venuesContainer.innerHTML = `<div class="error-message">Error loading venues: ${error.message || 'Unknown error'}</div>`;
    }
  }
  
  // User marker removed as requested
  // No user marker will be shown on the map
  
  // Handle venue marker click
  function handleVenueMarkerClick(venue, marker) {
    console.log('Venue clicked:', venue.name);
    
    // Update map center to the clicked venue
    map.panTo(venue.coords);
    
    // Highlight the active venue marker
    if (activeVenue && activeVenue !== marker) {
      // Reset previous active marker
      const prevPeopleCount = activeVenue.options.venueId ? 
        venue.people_count || 0 : 0;
      
      const prevMarkerHtml = `
        <div class="venue-marker">
          <div class="venue-marker-badge" style="background-color: #ff4d79; color: white; padding: 4px 8px; border-radius: 20px; font-weight: bold; text-align: center;">
            ${prevPeopleCount}
          </div>
        </div>
      `;
      
      activeVenue.setIcon(L.divIcon({
        className: 'custom-venue-marker',
        html: prevMarkerHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      }));
    }
    
    // Set this as the active venue
    activeVenue = marker;
    
    // Make this marker larger/highlighted
    const peopleCount = venue.people_count || 0;
    const activeMarkerHtml = `
      <div class="venue-marker">
        <div class="venue-marker-badge" style="background-color: #ff4d79; color: white; padding: 5px 10px; border-radius: 20px; font-weight: bold; text-align: center; box-shadow: 0 0 10px rgba(255,77,121,0.5);">
          ${peopleCount}
        </div>
      </div>
    `;
    
    marker.setIcon(L.divIcon({
      className: 'custom-venue-marker active',
      html: activeMarkerHtml,
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    }));
    
    // Update UI elements if they exist
    const connectBtn = document.querySelector('.connect-btn');
    const peopleCountSpan = document.querySelector('.people-count');
    
    if (connectBtn && peopleCountSpan) {
      // Only show the connect button if there are more than 5 people at the venue
      if (venue.peopleCount > 5) {
        // Update count and show button
        peopleCountSpan.textContent = venue.peopleCount;
        connectBtn.style.display = 'block';
      } else {
        // Hide button if fewer than 6 people
        connectBtn.style.display = 'none';
      }
    }
    
    // Save reference to active venue
    activeVenue = venue;
  }
  
  // Connect button event listener
  const connectBtn = document.querySelector('.connect-btn');
  if (connectBtn) {
    connectBtn.addEventListener('click', function() {
      if (activeVenue && activeVenue.options && activeVenue.options.venueId) {
        const venueId = activeVenue.options.venueId;
        const venueName = document.querySelector(`.venue-card[data-venue-id="${venueId}"] h3`)?.textContent || 'this venue';
        const peopleCount = document.querySelector(`.venue-card[data-venue-id="${venueId}"] .people-badge`)?.textContent.trim() || 'people';
        
        console.log(`Connecting with ${peopleCount} at ${venueName}`);
        alert(`Connecting with ${peopleCount} at ${venueName}...`);
      } else {
        alert('Please select a venue first');
      }
    });
  }
  
  // Custom zoom controls
  const zoomInBtn = document.querySelector('.zoom-in-btn');
  const zoomOutBtn = document.querySelector('.zoom-out-btn');
  
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', function() {
      map.zoomIn(1);
    });
  }
  
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', function() {
      map.zoomOut(1);
    });
  }
}



/**
 * Set up bottom navigation
 */
function setupBottomNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active class from all nav items
      navItems.forEach(navItem => {
        navItem.classList.remove('active');
      });
      
      // Add active class to clicked item
      this.classList.add('active');
      
      const targetHref = this.getAttribute('href');
      console.log('Navigation to:', targetHref);
      
      // Actually navigate to the target page
      if (targetHref && targetHref !== '#') {
        window.location.href = targetHref;
      }
    });
  });
}

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initDiscoverPage);
