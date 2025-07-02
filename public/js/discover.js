/**
 * discover.js
 * Manages the discover page functionality including venues, map, and navigation
 */

export async function initDiscoverPage() {
  console.log('Initialize discover page');
  setupHeaderButtons();
  setupVenueCards();
  setupMapElements();
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
      // TODO: Implement search functionality
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
function setupMapElements() {
  // Initialize Leaflet map
  const mapElement = document.getElementById('map');
  if (!mapElement) return;
  
  // Sample venues data with coordinates and people counts
  const venues = [
    {
      id: 1,
      name: "",
      coords: [32.7852, -96.7844],
      image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&auto=format&fit=crop",
      peopleCount: 12
    },
    {
      id: 2,
      name: "",
      coords: [32.7868, -96.7831],
      image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400&auto=format&fit=crop",
      peopleCount: 3
    },
    {
      id: 3,
      name: "",
      coords: [32.7841, -96.7852],
      image: "https://images.unsplash.com/photo-1485872299829-c673f5194813?w=400&auto=format&fit=crop",
      peopleCount: 7
    },
    {
      id: 4,
      name: "",
      coords: [32.7838, -96.7820],
      image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&auto=format&fit=crop",
      peopleCount: 9
    },
    {
      id: 5,
      name: "",
      coords: [32.7870, -96.7860],
      image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&auto=format&fit=crop",
      peopleCount: 6
    }
  ];
  
  // User location
  const userCoords = [32.7845, -96.7830]; // Nearby location
  
  // Initialize the map centered between venues
  const map = L.map('map', {
    center: venues[0].coords,
    zoom: 16,
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
  
  // Get SVG templates
  const venueMarkerTemplate = document.getElementById('venue-marker-template');
  const userMarkerTemplate = document.getElementById('user-marker-template');
  
  // Create and add venue markers
  let activeVenue = null;
  venues.forEach(venue => {
    // Clone the SVG template for this venue
    const markerSvg = venueMarkerTemplate.content.cloneNode(true);
    
    // Set the venue image
    const imgElement = markerSvg.querySelector('img');
    imgElement.src = venue.image;
    imgElement.alt = venue.name;
    
    // Convert SVG to string for the icon
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(markerSvg.querySelector('svg'));
    
    // Create a marker icon from the SVG
    const venueIcon = L.divIcon({
      className: 'custom-venue-marker',
      html: svgString, // removed venue name text
      iconSize: [40, 54],
      iconAnchor: [20, 54],
      popupAnchor: [0, -54]
    });
    
    // Create and add marker
    const marker = L.marker(venue.coords, {icon: venueIcon})
      .addTo(map)
      .on('click', () => handleVenueMarkerClick(venue, marker));
  });
  
  // Add user marker
  const userMarkerSvg = userMarkerTemplate.content.cloneNode(true);
  const userImgElement = userMarkerSvg.querySelector('img');
  userImgElement.src = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop";
  userImgElement.alt = "You";
  
  const serializer = new XMLSerializer();
  const userSvgString = serializer.serializeToString(userMarkerSvg.querySelector('svg'));
  
  const userIcon = L.divIcon({
    className: 'custom-user-marker pulsing',
    html: userSvgString,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
  
  const userMarker = L.marker(userCoords, {icon: userIcon}).addTo(map);
  
  // Handle venue marker click
  function handleVenueMarkerClick(venue, marker) {
    console.log('Venue clicked:', venue.name);
    
    // Update map center to the clicked venue
    map.panTo(venue.coords);
    
    // Get connect button and people count span
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
      if (activeVenue) {
        console.log(`Connecting with ${activeVenue.peopleCount} people at ${activeVenue.name}`);
        alert(`Connecting with ${activeVenue.peopleCount} people at ${activeVenue.name}...`);
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
