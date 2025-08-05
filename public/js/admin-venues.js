// public/js/admin-venues.js
// Admin Venues Page Controller
// Provides UI handlers for listing and creating venues.

import { createVenue } from './api/venues.js';

/**
 * Initialize the admin venues page.
 */
export function initAdminVenuesPage() {
  console.log('🛠️ Admin Venues Page init');

  const form = document.getElementById('venue-form');
  const listContainer = document.getElementById('venue-list');

  // Load venues initially
  loadVenues();

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';

      try {
        const name = form.name.value.trim();
        const description = form.description.value.trim();
        const city = form.city.value.trim();
        const category = form.category.value.trim();
        const lat = parseFloat(form.lat.value);
        const lng = parseFloat(form.lng.value);
        const image_url = form.image_url.value.trim();

        if (!name || isNaN(lat) || isNaN(lng)) {
          alert('Name, latitude and longitude are required');
          return;
        }

        const newVenue = {
          name,
          description,
          city,
          category,
          lat,
          lng,
          image_url: image_url || null
        };

        const created = await createVenue(newVenue);
        console.log('Venue created:', created);
        form.reset();
        await loadVenues();
        alert('Venue added successfully');
      } catch (err) {
        console.error('Failed to create venue:', err);
        alert(err.message || 'Failed to create venue');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Venue';
      }
    });
  }

  /**
   * Fetch venues from server and render table.
   */
  async function loadVenues() {
    try {
      listContainer.innerHTML = 'Loading venues...';
      const res = await fetch('/api/venues');
      if (!res.ok) throw new Error('Failed to fetch venues');
      const venues = await res.json();
      renderVenues(venues);
    } catch (err) {
      console.error(err);
      listContainer.innerHTML = `<p class="error">${err.message}</p>`;
    }
  }

  function renderVenues(venues = []) {
    if (!venues.length) {
      listContainer.innerHTML = '<p>No venues found.</p>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'venue-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>City</th>
          <th>Category</th>
          <th>Lat</th>
          <th>Lng</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    venues.forEach(v => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${v.id}</td>
        <td>${v.name}</td>
        <td>${v.city || ''}</td>
        <td>${v.category || ''}</td>
        <td>${v.location_lat || v.lat || ''}</td>
        <td>${v.location_lng || v.lng || ''}</td>
      `;
      tbody.appendChild(tr);
    });

    listContainer.innerHTML = '';
    listContainer.appendChild(table);
  }
}
