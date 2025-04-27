// app.js - Main application code

import {
    getAllTracks,
    getTrack,
    saveTrack,
    deleteTrack,
    getAllInstructions,
    getInstruction,
    saveInstruction,
    deleteInstruction
  } from './firebase.js';
  
// DOM Elements
const instructionsBtn = document.getElementById('instructionsBtn');
const tracksBtn = document.getElementById('tracksBtn');
const instructionsSection = document.getElementById('instructions');
const tracksSection = document.getElementById('tracks');
const createInstructionBtn = document.getElementById('createInstructionBtn');
const addTrackBtn = document.getElementById('addTrackBtn');
const instructionsTable = document.getElementById('instructionsTable').querySelector('tbody');
const tracksTable = document.getElementById('tracksTable').querySelector('tbody');
const themeToggle = document.getElementById('themeToggle');

// App State
let currentSection = 'instructions';
let tracks = {};
let instructions = {};

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);
instructionsBtn.addEventListener('click', () => switchSection('instructions'));
tracksBtn.addEventListener('click', () => switchSection('tracks'));
createInstructionBtn.addEventListener('click', showInstructionModal);
addTrackBtn.addEventListener('click', showTrackModal);
themeToggle.addEventListener('change', toggleTheme);
  
// Initialize App
async function initApp() {
  loadTheme();
  switchSection('instructions');
  await Promise.all([loadTracks(), loadInstructions()]);
}

// Theme Functions
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeToggle.checked = savedTheme === 'dark';
}

function toggleTheme() {
  const theme = themeToggle.checked ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// Navigation Functions
function switchSection(section) {
  currentSection = section;
  instructionsSection.classList.toggle('active', section === 'instructions');
  tracksSection.classList.toggle('active', section === 'tracks');
  
  instructionsBtn.style.backgroundColor = section === 'instructions' ? 'var(--primary-color)' : 'var(--secondary-color)';
  tracksBtn.style.backgroundColor = section === 'tracks' ? 'var(--primary-color)' : 'var(--secondary-color)';
}

// Data Loading Functions
async function loadTracks() {
  try {
    tracks = await getAllTracks();
    renderTracks();
  } catch (error) {
    showToast('Error loading tracks: ' + error.message, 'error');
  }
}

async function loadInstructions() {
  try {
    instructions = await getAllInstructions();
    renderInstructions();
  } catch (error) {
    showToast('Error loading instructions: ' + error.message, 'error');
  }
}

// Render Functions
function renderTracks() {
  tracksTable.innerHTML = '';
  
  if (Object.keys(tracks).length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="4" class="text-center">No tracks found. Add your first track!</td>';
    tracksTable.appendChild(row);
    return;
  }
  
  Object.entries(tracks).forEach(([id, track]) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${track.name}</td>
      <td>${track.noiseLimit} dB</td>
      <td>${track.length} km</td>
      <td class="actions">
        <button class="edit-btn" data-id="${id}">Edit</button>
        <button class="duplicate-btn" data-id="${id}">Duplicate</button>
        <button class="delete-btn" data-id="${id}">Delete</button>
      </td>
    `;
    
    row.querySelector('.edit-btn').addEventListener('click', () => showTrackModal(id));
    row.querySelector('.duplicate-btn').addEventListener('click', () => duplicateTrack(id));
    row.querySelector('.delete-btn').addEventListener('click', () => confirmDeleteTrack(id));
    
    tracksTable.appendChild(row);
  });
}

function renderInstructions() {
  instructionsTable.innerHTML = '';
  
  if (Object.keys(instructions).length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="3" class="text-center">No instructions found. Create your first instruction!</td>';
    instructionsTable.appendChild(row);
    return;
  }
  
  Object.entries(instructions).forEach(([id, instruction]) => {
    const dates = Array.isArray(instruction.dates) 
      ? instruction.dates.join(', ') 
      : new Date(instruction.date).toLocaleDateString();
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${instruction.trackName || 'Unknown'}</td>
      <td>${dates}</td>
      <td class="actions">
        <button class="edit-btn" data-id="${id}">Edit</button>
        <button class="duplicate-btn" data-id="${id}">Duplicate</button>
        <button class="preview-btn" data-id="${id}">Preview</button>
        <button class="delete-btn" data-id="${id}">Delete</button>
      </td>
    `;
    
    row.querySelector('.edit-btn').addEventListener('click', () => showInstructionModal(id));
    row.querySelector('.duplicate-btn').addEventListener('click', () => duplicateInstruction(id));
    row.querySelector('.preview-btn').addEventListener('click', () => previewInstruction(id));
    row.querySelector('.delete-btn').addEventListener('click', () => confirmDeleteInstruction(id));
    
    instructionsTable.appendChild(row);
  });
}

// Track Functions
async function showTrackModal(trackId = null) {
  let track = {
    name: '',
    noiseLimit: 100,
    location: '',
    builtYear: 2000,
    length: 0,
    corners: 0,
    logoUrl: '',
    trackShapeUrl: ''
  };

  if (trackId && tracks[trackId]) {
    track = { ...tracks[trackId] };
  }

  const modal = createModal('Track Details');

  modal.content.innerHTML = `
    <form id="trackForm" class="track-form-grid">
      <div class="form-group">
        <label for="trackName">Track Name</label>
        <input type="text" id="trackName" class="form-input" value="${track.name}" required>
      </div>
      <div class="form-group">
        <label for="noiseLimit">Noise Limit (dB)</label>
        <input type="number" id="noiseLimit" class="form-input" value="${track.noiseLimit}" required>
      </div>
      <div class="form-group">
        <label for="location">Location</label>
        <input type="text" id="location" class="form-input" value="${track.location}" required>
      </div>
      <div class="form-group">
        <label for="builtYear">Built Year</label>
        <input type="number" id="builtYear" class="form-input" value="${track.builtYear}" required>
      </div>
      <div class="form-group">
        <label for="length">Length (km)</label>
        <input type="number" id="length" step="0.01" class="form-input" value="${track.length}" required>
      </div>
      <div class="form-group">
        <label for="corners">Number of Corners</label>
        <input type="number" id="corners" class="form-input" value="${track.corners}" required>
      </div>
      <div class="form-group">
        <label for="logoUrl">Logo URL</label>
        <input type="url" id="logoUrl" class="form-input" value="${track.logoUrl}">
        <div class="track-form-image-preview" id="logoImagePreview" style="background-image: url('${track.logoUrl}')"></div>
      </div>
      <div class="form-group">
        <label for="trackShapeUrl">Track Shape Image URL</label>
        <input type="url" id="trackShapeUrl" class="form-input" value="${track.trackShapeUrl}">
        <div class="track-form-image-preview" id="trackImagePreview" style="background-image: url('${track.trackShapeUrl}')"></div>
      </div>
      <div class="form-buttons" style="grid-column: span 2;">
        <button type="button" id="cancelTrackBtn" class="delete-btn">Cancel</button>
        <button type="submit" class="edit-btn">Save Track</button>
      </div>
    </form>
  `;

  const trackForm = modal.content.querySelector('#trackForm');
  const cancelBtn = modal.content.querySelector('#cancelTrackBtn');
  const trackShapeUrl = modal.content.querySelector('#trackShapeUrl');
  const trackImagePreview = modal.content.querySelector('#trackImagePreview');
  const logoUrl = modal.content.querySelector('#logoUrl');
  const logoImagePreview = modal.content.querySelector('#logoImagePreview');

  // Add event listeners for both image previews
  trackShapeUrl.addEventListener('input', () => {
    trackImagePreview.style.backgroundImage = `url('${trackShapeUrl.value}')`;
  });
  
  logoUrl.addEventListener('input', () => {
    logoImagePreview.style.backgroundImage = `url('${logoUrl.value}')`;
  });

  cancelBtn.addEventListener('click', () => modal.close());

  trackForm.addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const updatedTrack = {
      name: trackForm.querySelector('#trackName').value,
      noiseLimit: parseInt(trackForm.querySelector('#noiseLimit').value),
      location: trackForm.querySelector('#location').value,
      builtYear: parseInt(trackForm.querySelector('#builtYear').value),
      length: parseFloat(trackForm.querySelector('#length').value),
      corners: parseInt(trackForm.querySelector('#corners').value),
      logoUrl: trackForm.querySelector('#logoUrl').value,
      trackShapeUrl: trackForm.querySelector('#trackShapeUrl').value
    };
  
    try {
      // Ensure trackId is either a string or null
      const idToUse = trackId && typeof trackId === 'string' ? trackId : null;
      await saveTrack(updatedTrack, idToUse);
      await loadTracks();
      modal.close();
      showToast(`Track successfully ${idToUse ? 'updated' : 'created'}!`, 'success');
    } catch (error) {
      showToast('Error saving track: ' + error.message, 'error');
    }
  });  

  modal.show();
}

async function duplicateTrack(trackId) {
  if (!tracks[trackId]) return;
  
  try {
    const track = { ...tracks[trackId], name: `${tracks[trackId].name} (Copy)` };
    await saveTrack(track);
    await loadTracks();
    showToast('Track duplicated successfully!', 'success');
  } catch (error) {
    showToast('Error duplicating track: ' + error.message, 'error');
  }
}

async function confirmDeleteTrack(trackId) {
  if (!tracks[trackId]) return;
  
  const isConfirmed = confirm(`Are you sure you want to delete the track "${tracks[trackId].name}"?`);
  
  if (isConfirmed) {
    try {
      await deleteTrack(trackId);
      await loadTracks();
      showToast('Track deleted successfully!', 'success');
    } catch (error) {
      showToast('Error deleting track: ' + error.message, 'error');
    }
  }
}
  
// Instruction Functions
async function showInstructionModal(instructionId = null) {
  let currentInstructionId = instructionId; // Explicitly store the ID
  let instruction = {
    trackId: '',
    trackName: '',
    dates: [],
    overtakingRules: 'eitherSide',
    noiseLimit: '',
    schedule: [{ startText: '', startText2: '', startTime: '09:00', endTime: '17:00', activity: 'Track Session', activity2: '', location: 'Main Track' }],
    locations: [{ name: 'Reception', name2: '', address: '' }],
    notes: ''
  };
  
  if (instructionId && instructions[instructionId]) {
    instruction = { ...instructions[instructionId] };
  }
  
  // Format dates for calendar
  const selectedDates = instruction.dates || [];
  
  const modal = createModal('Final Instruction Details');
  
  const trackOptions = Object.entries(tracks).map(([id, track]) => 
    `<option value="${id}" ${instruction.trackId === id ? 'selected' : ''}>${track.name}</option>`
  ).join('');
  
  modal.content.innerHTML = `
    <form id="instructionForm">
      <div class="form-group">
        <label for="trackSelect">Select Track</label>
        <select id="trackSelect" class="form-input" required>
          <option value="">-- Select Track --</option>
          ${trackOptions}
        </select>
      </div>
      
      <div class="form-group">
        <label>Select Dates</label>
        <div id="calendarContainer" class="calendar mb-20"></div>
        <div id="selectedDates" class="selected-dates-container mb-20"></div>
      </div>
      
      <div class="form-group">
        <label>Overtaking Rules</label>
        <div class="overtaking-options">
          <div class="overtaking-option">
            <input type="radio" id="leftSideOnly" name="overtakingRules" value="leftSideOnly" ${instruction.overtakingRules === 'leftSideOnly' ? 'checked' : ''}>
            <label for="leftSideOnly">Left Side Only</label>
          </div>
          <div class="overtaking-option">
            <input type="radio" id="rightSideOnly" name="overtakingRules" value="rightSideOnly" ${instruction.overtakingRules === 'rightSideOnly' ? 'checked' : ''}>
            <label for="rightSideOnly">Right Side Only</label>
          </div>
          <div class="overtaking-option">
            <input type="radio" id="eitherSide" name="overtakingRules" value="eitherSide" ${instruction.overtakingRules === 'eitherSide' ? 'checked' : ''}>
            <label for="eitherSide">Either Side</label>
          </div>
        </div>
      </div>
      
      <div class="form-group">
        <label for="noiseLimit">Noise Limit (dB)</label>
        <input type="number" id="noiseLimit" class="form-input" value="${instruction.noiseLimit || ''}" required>
      </div>
      
      <div class="form-group">
        <label>Schedule</label>
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Start Text (EN)</th>
              <th>Start Text (2nd)</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Activity (EN)</th>
              <th>Activity (2nd)</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="scheduleTableBody">
          </tbody>
        </table>
        <button type="button" id="addScheduleRowBtn" class="add-row-btn">Add Schedule Row</button>
      </div>
      
      <div class="form-group">
        <label>Important Locations</label>
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Location Name (EN)</th>
              <th>Location Name (2nd)</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="locationsTableBody">
          </tbody>
        </table>
        <button type="button" id="addLocationRowBtn" class="add-row-btn">Add Location</button>
      </div>
      
      <div class="form-group">
        <label for="notes">Additional Notes</label>
        <textarea id="notes" class="form-input" rows="5">${instruction.notes || ''}</textarea>
      </div>
      
      <div class="form-buttons">
        <button type="button" id="cancelInstructionBtn" class="delete-btn">Cancel</button>
        <button type="button" id="previewInstructionBtn" class="preview-btn">Preview</button>
        <button type="submit" class="edit-btn">Save</button>
      </div>
    </form>
  `;
  
  const instructionForm = modal.content.querySelector('#instructionForm');
  const cancelBtn = modal.content.querySelector('#cancelInstructionBtn');
  const previewBtn = modal.content.querySelector('#previewInstructionBtn');
  const scheduleTableBody = modal.content.querySelector('#scheduleTableBody');
  const locationsTableBody = modal.content.querySelector('#locationsTableBody');
  const addScheduleRowBtn = modal.content.querySelector('#addScheduleRowBtn');
  const addLocationRowBtn = modal.content.querySelector('#addLocationRowBtn');
  const trackSelect = modal.content.querySelector('#trackSelect');
  const noiseLimit = modal.content.querySelector('#noiseLimit');
  const calendarContainer = modal.content.querySelector('#calendarContainer');
  const selectedDatesContainer = modal.content.querySelector('#selectedDates');
  
  // Initialize calendar
  initCalendar(calendarContainer, selectedDatesContainer, selectedDates);
  
  // Populate schedule table
  renderScheduleTable(scheduleTableBody, instruction.schedule || []);
  
  // Populate locations table
  renderLocationsTable(locationsTableBody, instruction.locations || []);
  
  // Event listeners
  trackSelect.addEventListener('change', async () => {
    const trackId = trackSelect.value;
    if (trackId) {
      try {
        const track = await getTrack(trackId);
        if (track) {
          noiseLimit.value = track.noiseLimit;
        }
      } catch (error) {
        console.error('Error loading track details:', error);
      }
    }
  });
  
  addScheduleRowBtn.addEventListener('click', () => {
    const newRow = { startText: '', startText2: '', startTime: '09:00', endTime: '17:00', activity: '', activity2: '', location: '' };
    const currentSchedule = getScheduleFromTable(scheduleTableBody);
    renderScheduleTable(scheduleTableBody, [...currentSchedule, newRow]);
  });
  
  addLocationRowBtn.addEventListener('click', () => {
    const newLocation = { name: '', name2: '', address: '' };
    const currentLocations = getLocationsFromTable(locationsTableBody);
    renderLocationsTable(locationsTableBody, [...currentLocations, newLocation]);
  });
  
  cancelBtn.addEventListener('click', () => modal.close());
  
  previewBtn.addEventListener('click', () => {
    const formData = getInstructionFormData(
      instructionForm, 
      scheduleTableBody,
      locationsTableBody,
      selectedDatesContainer
    );
    
    // Open preview in a new modal
    showInstructionPreview(formData);
  });
  
  instructionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get the form data
    const formData = getInstructionFormData(
      instructionForm, 
      scheduleTableBody,
      locationsTableBody,
      selectedDatesContainer
    );
    
    try {
      // Ensure instructionId is either a string or null
      const idToUse = instructionId && typeof instructionId === 'string' ? instructionId : null;
      await saveInstruction(formData, idToUse);
      await loadInstructions();
      modal.close();
      showToast(`Instruction successfully ${idToUse ? 'updated' : 'created'}!`, 'success');
    } catch (error) {
      showToast('Error saving instruction: ' + error.message, 'error');
    }
  });

  modal.show();
}
  
function getInstructionFormData(form, scheduleTableBody, locationsTableBody, selectedDatesContainer) {
  const trackId = form.querySelector('#trackSelect').value;
  const trackName = form.querySelector('#trackSelect').options[form.querySelector('#trackSelect').selectedIndex].text;
  const overtakingRules = form.querySelector('input[name="overtakingRules"]:checked').value;
  const noiseLimit = form.querySelector('#noiseLimit').value;
  const notes = form.querySelector('#notes').value;
  
  // Get selected dates
  const selectedDates = Array.from(selectedDatesContainer.querySelectorAll('.selected-date'))
    .map(el => el.dataset.date);
  
  // Get schedule
  const schedule = getScheduleFromTable(scheduleTableBody);
  
  // Get locations
  const locations = getLocationsFromTable(locationsTableBody);
  
  return {
    trackId,
    trackName,
    dates: selectedDates,
    overtakingRules,
    noiseLimit,
    schedule,
    locations,
    notes
  };
}
  
function getScheduleFromTable(tableBody) {
  return Array.from(tableBody.querySelectorAll('tr')).map(row => {
    return {
      startText: row.querySelector('input[name="startText"]').value,
      startText2: row.querySelector('input[name="startText2"]').value,
      startTime: row.querySelector('input[name="startTime"]').value,
      endTime: row.querySelector('input[name="endTime"]').value,
      activity: row.querySelector('input[name="activity"]').value,
      activity2: row.querySelector('input[name="activity2"]').value,
      location: row.querySelector('input[name="location"]').value
    };
  });
}

function getLocationsFromTable(tableBody) {
  return Array.from(tableBody.querySelectorAll('tr')).map(row => {
    return {
      name: row.querySelector('input[name="locationName"]').value,
      name2: row.querySelector('input[name="locationName2"]').value,
      address: row.querySelector('input[name="address"]').value
    };
  });
}
  
function renderScheduleTable(tableBody, scheduleItems) {
  tableBody.innerHTML = '';
  
  scheduleItems.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" name="startText" class="form-input" value="${item.startText || ''}" placeholder="Optional text (EN)"></td>
      <td><input type="text" name="startText2" class="form-input" value="${item.startText2 || ''}" placeholder="Optional text (2nd lang)"></td>
      <td><input type="time" name="startTime" class="form-input" value="${item.startTime}" required></td>
      <td><input type="time" name="endTime" class="form-input" value="${item.endTime}" placeholder="Optional"></td>
      <td><input type="text" name="activity" class="form-input" value="${item.activity}" required placeholder="Activity (EN)"></td>
      <td><input type="text" name="activity2" class="form-input" value="${item.activity2 || ''}" placeholder="Activity (2nd lang)"></td>
      <td><input type="text" name="location" class="form-input" value="${item.location}" required></td>
      <td>
        <button type="button" class="delete-btn">Remove</button>
      </td>
    `;
    
    row.querySelector('.delete-btn').addEventListener('click', () => {
      if (tableBody.querySelectorAll('tr').length > 1 || confirm('Remove the last schedule item?')) {
        row.remove();
      }
    });
    
    tableBody.appendChild(row);
  });
  
  // Add at least one row if empty
  if (tableBody.querySelectorAll('tr').length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" name="startText" class="form-input" placeholder="Optional text (EN)"></td>
      <td><input type="text" name="startText2" class="form-input" placeholder="Optional text (2nd lang)"></td>
      <td><input type="time" name="startTime" class="form-input" value="09:00" required></td>
      <td><input type="time" name="endTime" class="form-input" value="17:00" placeholder="Optional"></td>
      <td><input type="text" name="activity" class="form-input" value="Track Session" required placeholder="Activity (EN)"></td>
      <td><input type="text" name="activity2" class="form-input" placeholder="Activity (2nd lang)"></td>
      <td><input type="text" name="location" class="form-input" value="Main Track" required></td>
      <td>
        <button type="button" class="delete-btn">Remove</button>
      </td>
    `;
    
    row.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm('Remove the last schedule item?')) {
        row.remove();
      }
    });
    
    tableBody.appendChild(row);
  }
}
  
function renderLocationsTable(tableBody, locations) {
  tableBody.innerHTML = '';
  
  locations.forEach((location, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" name="locationName" class="form-input" value="${location.name}" required placeholder="Location (EN)"></td>
      <td><input type="text" name="locationName2" class="form-input" value="${location.name2 || ''}" placeholder="Location (2nd lang)"></td>
      <td><input type="text" name="address" class="form-input" value="${location.address}" required></td>
      <td>
        <button type="button" class="delete-btn">Remove</button>
      </td>
    `;
    
    row.querySelector('.delete-btn').addEventListener('click', () => {
      if (tableBody.querySelectorAll('tr').length > 1 || confirm('Remove the last location?')) {
        row.remove();
      }
    });
    
    tableBody.appendChild(row);
  });
  
  // Add at least one row if empty
  if (tableBody.querySelectorAll('tr').length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" name="locationName" class="form-input" value="Reception" required placeholder="Location (EN)"></td>
      <td><input type="text" name="locationName2" class="form-input" placeholder="Location (2nd lang)"></td>
      <td><input type="text" name="address" class="form-input" value="" required></td>
      <td>
        <button type="button" class="delete-btn">Remove</button>
      </td>
    `;
    
    row.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm('Remove the last location?')) {
        row.remove();
      }
    });
    
    tableBody.appendChild(row);
  }
}
  
function initCalendar(container, selectedDatesContainer, initialSelectedDates = []) {
  // Current date for calendar
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  
  // Store selected dates
  let selectedDates = [...initialSelectedDates];
  
  // Render calendar
  function renderCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    container.innerHTML = `
      <div class="calendar-header">
        <button type="button" id="prevMonth" class="edit-btn">&lt;</button>
        <h3>${new Date(currentYear, currentMonth).toLocaleDateString('default', { month: 'long', year: 'numeric' })}</h3>
        <button type="button" id="nextMonth" class="edit-btn">&gt;</button>
      </div>
      
      <div class="calendar-day">Sun</div>
      <div class="calendar-day">Mon</div>
      <div class="calendar-day">Tue</div>
      <div class="calendar-day">Wed</div>
      <div class="calendar-day">Thu</div>
      <div class="calendar-day">Fri</div>
      <div class="calendar-day">Sat</div>
    `;
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-date disabled';
      container.appendChild(emptyDay);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateCell = document.createElement('div');
      dateCell.className = 'calendar-date';
      dateCell.textContent = day;
      
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dateCell.dataset.date = dateStr;
      
      // Check if date is selected
      if (selectedDates.includes(dateStr)) {
        dateCell.classList.add('selected');
      }
      
      dateCell.addEventListener('click', () => {
        const index = selectedDates.indexOf(dateStr);
        if (index === -1) {
          selectedDates.push(dateStr);
          dateCell.classList.add('selected');
        } else {
          selectedDates.splice(index, 1);
          dateCell.classList.remove('selected');
        }
        updateSelectedDatesDisplay();
      });
      
      container.appendChild(dateCell);
    }
    
    // Event listeners for month navigation
    container.querySelector('#prevMonth').addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
    });
    
    container.querySelector('#nextMonth').addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar();
    });
    
    updateSelectedDatesDisplay();
  }
  
  function updateSelectedDatesDisplay() {
    selectedDatesContainer.innerHTML = '';
    
    if (selectedDates.length === 0) {
      selectedDatesContainer.innerHTML = '<p>No dates selected.</p>';
      return;}
  
      // Sort dates chronologically
      selectedDates.sort();
      
      selectedDatesContainer.innerHTML = '<p><strong>Selected Dates:</strong></p>';
      
      selectedDates.forEach(dateStr => {
        const datePill = document.createElement('span');
        datePill.className = 'selected-date';
        datePill.dataset.date = dateStr;
        
        const dateObj = new Date(dateStr);
        datePill.textContent = dateObj.toLocaleDateString();
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '&times;';
        removeBtn.className = 'remove-date-btn';
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const index = selectedDates.indexOf(dateStr);
          if (index !== -1) {
            selectedDates.splice(index, 1);
            datePill.remove();
            
            // Update calendar UI
            const calendarDate = container.querySelector(`.calendar-date[data-date="${dateStr}"]`);
            if (calendarDate) {
              calendarDate.classList.remove('selected');
            }
            
            updateSelectedDatesDisplay();
          }
        });
        
        datePill.appendChild(removeBtn);
        selectedDatesContainer.appendChild(datePill);
      });
    }
    
    // Initialize calendar
    renderCalendar();
}
    
async function showInstructionPreview(instruction) {
  const trackDetails = instruction.trackId ? tracks[instruction.trackId] : null;
  
  const modal = createModal('Instruction Preview');
  
  // Format dates for display
  const formattedDates = instruction.dates.map(date => new Date(date).toLocaleDateString()).join(', ');
  
  let overtakingText = '';
  switch (instruction.overtakingRules) {
    case 'leftSideOnly':
      overtakingText = 'Left Side Only';
      break;
    case 'rightSideOnly':
      overtakingText = 'Right Side Only';
      break;
    case 'eitherSide':
      overtakingText = 'Either Side';
      break;
  }
  
  // Create schedule table HTML with bilingual support
  const scheduleTableHTML = `
    <table class="schedule-table-preview">
      <thead>
        <tr>
          <th>Start</th>
          <th>End</th>
          <th>Activity</th>
          <th>Location</th>
        </tr>
      </thead>
      <tbody>
        ${instruction.schedule.map(item => `
          <tr>
            <td>
              ${item.startText ? `<div>${item.startText}</div>` : ''}
              ${item.startText2 ? `<div class="secondary-language">${item.startText2}</div>` : ''}
              <div>${item.startTime}</div>
            </td>
            <td>${item.endTime}</td>
            <td>
              <div>${item.activity}</div>
              ${item.activity2 ? `<div class="secondary-language">${item.activity2}</div>` : ''}
            </td>
            <td>${item.location}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  // Create locations table HTML with bilingual support
  const locationsTableHTML = `
    <table class="schedule-table-preview">
      <thead>
        <tr>
          <th>Location Name</th>
          <th>Address</th>
        </tr>
      </thead>
      <tbody>
        ${instruction.locations.map(location => `
          <tr>
            <td>
              <div>${location.name}</div>
              ${location.name2 ? `<div class="secondary-language">${location.name2}</div>` : ''}
            </td>
            <td>${location.address}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  modal.content.innerHTML = `
    <div class="instruction-preview">
      <div class="instruction-header">
        <div class="instruction-title">${instruction.trackName} - Final Instructions</div>
        <div class="instruction-dates">${formattedDates}</div>
      </div>
      
      ${trackDetails ? `
        <div class="track-card">
          ${trackDetails.trackShapeUrl ? `
            <div class="track-image" style="background-image: url('${trackDetails.trackShapeUrl}')"></div>
          ` : ''}
          <div class="track-info">
            <h3>${trackDetails.name}</h3>
            ${trackDetails.logoUrl ? `
              <div class="track-logo" style="background-image: url('${trackDetails.logoUrl}'); height: 60px; background-size: contain; background-repeat: no-repeat; background-position: left center; margin-bottom: 10px;"></div>
            ` : ''}
            <div class="track-stats">
              <div class="stat-item">
                <strong>Noise Limit:</strong> ${instruction.noiseLimit} dB
              </div>
              <div class="stat-item">
                <strong>Length:</strong> ${trackDetails.length} km
              </div>
              <div class="stat-item">
                <strong>Location:</strong> ${trackDetails.location}
              </div>
              <div class="stat-item">
                <strong>Corners:</strong> ${trackDetails.corners}
              </div>
            </div>
          </div>
        </div>
      ` : ''}
      
      <div class="instruction-section">
        <h4>Overtaking Rules</h4>
        <p>${overtakingText}</p>
      </div>
      
      <div class="instruction-section">
        <h4>Daily Schedule</h4>
        ${scheduleTableHTML}
      </div>
      
      <div class="instruction-section">
        <h4>Important Locations</h4>
        ${locationsTableHTML}
      </div>
      
      ${instruction.notes ? `
        <div class="instruction-section">
          <h4>Additional Notes</h4>
          <div class="notes-section">
            ${instruction.notes.replace(/\n/g, '<br>')}
          </div>
        </div>
      ` : ''}
    </div>
    
    <div class="form-buttons">
      <button type="button" id="closePreviewBtn" class="delete-btn">Close</button>
    </div>
  `;
  
  modal.content.querySelector('#closePreviewBtn').addEventListener('click', () => modal.close());
  
  modal.show();
}
    
async function duplicateInstruction(instructionId) {
  if (!instructions[instructionId]) return;
  
  try {
    const instruction = {
      ...instructions[instructionId],
      trackName: `${instructions[instructionId].trackName} (Copy)`
    };
    
    await saveInstruction(instruction);
    await loadInstructions();
    showToast('Instruction duplicated successfully!', 'success');
  } catch (error) {
    showToast('Error duplicating instruction: ' + error.message, 'error');
  }
}
    
async function previewInstruction(instructionId) {
  if (!instructions[instructionId]) return;
  
  try {
    const instruction = instructions[instructionId];
    await showInstructionPreview(instruction);
  } catch (error) {
    showToast('Error loading instruction preview: ' + error.message, 'error');
  }
}
    
async function confirmDeleteInstruction(instructionId) {
  if (!instructions[instructionId]) return;
  
  const isConfirmed = confirm(`Are you sure you want to delete this instruction for "${instructions[instructionId].trackName}"?`);
  
  if (isConfirmed) {
    try {
      await deleteInstruction(instructionId);
      await loadInstructions();
      showToast('Instruction deleted successfully!', 'success');
    } catch (error) {
      showToast('Error deleting instruction: ' + error.message, 'error');
    }
  }
}
    
// Helper Functions
function createModal(title) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalContent.innerHTML = `<h2>${title}</h2>`;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Add animation delay
  setTimeout(() => modal.classList.add('active'), 10);
  
  return {
    content: modalContent,
    show: () => {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    },
    close: () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => modal.remove(), 300);
    }
  };
}
    
function showToast(message, type = 'success') {
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: 'top',
    position: 'right',
    className: `toastify-${type}`,
  }).showToast();
}

// Export functions for potential use in other modules
export {
  loadTracks,
  loadInstructions,
  showInstructionModal,
  showTrackModal,
  previewInstruction
};
