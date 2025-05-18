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
document.addEventListener('DOMContentLoaded', initializeApplication);
instructionsBtn.addEventListener('click', () => switchSection('instructions'));
tracksBtn.addEventListener('click', () => switchSection('tracks'));
createInstructionBtn.addEventListener('click', showInstructionModal);
addTrackBtn.addEventListener('click', showTrackModal);
themeToggle.addEventListener('change', toggleTheme);

// Replace the existing initApp function with this:
async function initializeApplication() {
  loadTheme();
  
  // Set data-preview attribute if in preview mode
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('preview')) {
    document.documentElement.setAttribute('data-preview', 'true');
    document.body.style.background = 'white'; // Ensure white background for print
  }
  
  // Check for preview mode first
  if (checkForPreviewMode()) {
    return;
  }
  
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

function checkForPreviewMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const previewId = urlParams.get('preview');
  
  if (previewId) {
    // Clear existing content and set up print-friendly styles
    document.body.innerHTML = `
      <div id="fullscreen-preview" class="fullscreen-preview"></div>
    `;
    
    document.head.innerHTML += `
      <style>
        body, html {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: auto;
          background: white;
        }
        .fullscreen-preview {
          width: 100%;
          min-height: 100vh;
          background: white;
          padding: 0;
          margin: 0;
        }
        ${document.querySelector('style')?.textContent || ''}
      </style>
    `;
    
    // Load data and show preview
    loadTracks().then(() => {
      return loadInstructions();
    }).then(() => {
      if (instructions[previewId]) {
        showFullScreenPreview(instructions[previewId]);
      } else {
        document.getElementById('fullscreen-preview').innerHTML = `
          <div style="padding: 20px;">
            <h1>Instruction not found</h1>
            <p>The requested instruction could not be loaded.</p>
          </div>
        `;
      }
    }).catch(error => {
      document.getElementById('fullscreen-preview').innerHTML = `
        <div style="padding: 20px;">
          <h1>Error loading preview</h1>
          <p>${error.message}</p>
        </div>
      `;
    });
    
    return true;
  }
  return false;
}

function showFullScreenPreview(instruction) {
  const trackDetails = instruction.trackId ? tracks[instruction.trackId] : null;
  const previewContainer = document.getElementById('fullscreen-preview');
  
  // Clear any existing content
  previewContainer.innerHTML = '';
  
  // Create the A4 container
  const a4Container = document.createElement('div');
  a4Container.className = 'a4-preview';
  
  // Format dates for display
  const formattedDates = instruction.dates.map(date => new Date(date).toLocaleDateString()).join(', ');

  // Create the preview HTML - using the updated structure
  a4Container.innerHTML = `
    <!-- Page 1 -->
    <div class="a4-page">
      <div class="a4-page-1">
        <!-- Left Section -->
        <div class="a4-left-section">
          <!-- Track Logo -->
          ${trackDetails?.logoUrl ? `
            <div class="track-logo-container">
              <img src="${trackDetails.logoUrl}" alt="${trackDetails.name} Logo" class="track-logo">
            </div>
          ` : ''}
          
          <!-- Schedule Section -->
          <div class="preview-section schedule-section">
            <div class="section-header red-bg">
              <div>${instruction.scheduleLabel || 'Schedule'}</div>
              ${instruction.scheduleLabel2 ? `<div class="secondary-language">${instruction.scheduleLabel2}</div>` : ''}
            </div>
            <div class="schedule-entries">
              <div class="schedule-header">
                <div class="schedule-col time-col">Time</div>
                <div class="schedule-col activity-col">Activity</div>
                <div class="schedule-col location-col">Location</div>
              </div>
              ${groupByDate(instruction.schedule)
                .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB)) // Sort dates newest to oldest
                .map(([date, items]) => `
                  <div class="schedule-date-group">
                    <div class="section-subheader">
                      ${new Date(date).toLocaleDateString()} • ${instruction.trackName} ${instruction.eventName || ''}
                    </div>
                    ${items.map(item => `
                      <div class="schedule-entry">
                        <div class="schedule-col time-col">
                          ${item.startText || item.startText2 ? `
                            <div class="schedule-time-text">
                              ${item.startText ? `<span>${item.startText}</span>` : ''}
                              ${item.startText2 ? `<span class="secondary-language">${item.startText2}</span>` : ''}
                              ${item.startTime}${item.endTime ? ` – ${item.endTime}` : ''}
                            </div>
                          ` : `
                            <div class="schedule-time">${item.startTime}${item.endTime ? ` – ${item.endTime}` : ''}</div>
                          `}
                        </div>
                        <div class="schedule-col activity-col">
                          ${item.activity ? `<div>${item.activity}</div>` : ''}
                          ${item.activity2 ? `<div class="secondary-language">${item.activity2}</div>` : ''}
                        </div>
                        <div class="schedule-col location-col">
                          ${item.location ? `<div class="schedule-location">${item.location}</div>` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `).join('')}
            </div>
          </div>
          
          <!-- Important Locations Section -->
          <div class="preview-section locations-section">
            <div class="section-header orange-bg">
              <div>${instruction.locationsLabel || 'Important Locations'}</div>
              ${instruction.locationsLabel2 ? `<div class="secondary-language">${instruction.locationsLabel2}</div>` : ''}
            </div>
            <div class="locations-entries">
              ${instruction.locations.map(location => `
                <div class="location-entry">
                  <div class="location-name">
                    <div>${location.name}${location.name2 ? ` <span class="secondary-language">/ ${location.name2}</span>` : ''}</div>
                  </div>
                  <div class="location-address">${location.address}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Overtaking Rules Section -->
          <div class="preview-section overtaking-section">
            <div class="section-header green-bg">
              <div>${instruction.overtakingRulesLabel || 'Overtaking Rules'}</div>
              ${instruction.overtakingRulesLabel2 ? `<div class="secondary-language">${instruction.overtakingRulesLabel2}</div>` : ''}
            </div>
            <div class="overtaking-content">
              ${instruction.overtakingText1 ? `<div class="overtaking-text">${instruction.overtakingText1} <span class="overtaking-rule">${instruction.overtakingRules === 'leftSideOnly' ? 'Left Side Only' : 
                  instruction.overtakingRules === 'rightSideOnly' ? 'Right Side Only' : 
                  'Either Side'}</span> ${instruction.overtakingText2 || ''}</div>` : ''}

              ${instruction.overtakingText1Second ? `<div class="overtaking-text secondary-language">${instruction.overtakingText1Second} <span class="overtaking-rule">${instruction.overtakingSecond || ''}</span> ${instruction.overtakingText2Second || ''}</div>` : ''}
            </div>
          </div>
          
          <!-- Track Warnings Section -->
          <div class="preview-section warnings-section">
            <div class="section-header yellow-bg">
              <div>${instruction.warningsLabel || 'Track Warnings'}</div>
              ${instruction.warningsLabel2 ? `<div class="secondary-language">${instruction.warningsLabel2}</div>` : ''}
            </div>
            <div class="warnings-grid">
              ${instruction.warnings && instruction.warnings.length ? instruction.warnings.map(warning => `
                <div class="warning-item">
                  ${warning.imageUrl ? `
                    <div class="warning-image">
                      <img src="${warning.imageUrl}" alt="${warning.name}">
                    </div>
                  ` : ''}
                  <div class="warning-text">
                    <div class="warning-name">${warning.name || ''}</div>
                    ${warning.name2 ? `<div class="warning-name secondary-language">${warning.name2}</div>` : ''}
                  </div>
                </div>
              `).join('') : ''}
            </div>
          </div>
          
          <!-- Footer with image if available -->
          <div class="preview-footer">
            ${trackDetails?.footerImageUrl ? `
              <img src="${trackDetails.footerImageUrl}" alt="Footer" class="footer-image">
            ` : ''}
          </div>
        </div>
        
        <!-- Right Section -->
        <div class="a4-right-section">
          <!-- Top Area -->
          <div class="right-top-area">
            <div class="track-name">${instruction.trackName} • ${instruction.instructionName} </div>
            <div class="event-dates">${formattedDates}</div>
          </div>
          
          <!-- Additional Notes Section -->
          <div class="preview-section notes-section">
            <div class="section-header blue-bg">
              <div>${instruction.notesLabel || 'Additional Notes'}</div>
              ${instruction.notesLabel2 ? `<div class="secondary-language">${instruction.notesLabel2}</div>` : ''}
            </div>
            <div class="notes-content">
              <!-- Noise Limit -->
              ${instruction.noiseLimit ? `
                <div class="noise-limit-entry">
                  ${instruction.noiseLimitText ? `<div>${instruction.noiseLimitText}${instruction.noiseLimitTextSecond ? ` <span class="secondary-language">/ ${instruction.noiseLimitTextSecond}</span>` : ''}</div>` : ''}
                  <div class="noise-limit-value">${instruction.noiseLimit} dB</div>
                </div>
              ` : ''}
              
              <!-- Additional Notes -->
              ${instruction.notes && instruction.notes.length ? instruction.notes.map(note => `
                <div class="note-entry">
                  ${note.text ? `<div>${note.text}${note.text2 ? ` <span class="secondary-language">/ ${note.text2}</span>` : ''}</div>` : ''}
                </div>
                  ${note.imageUrl ? `
                    <div class="note-image-container">
                      <img src="${note.imageUrl}" alt="Note image">
                    </div>
                  ` : ''}
              `).join('') : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Page 2 - Track Shape -->
    ${trackDetails?.trackShapeUrl ? `
      <div class="a4-page">
        <div class="a4-page-2">
          <div class="track-shape-container">
            <img src="${trackDetails.trackShapeUrl}" alt="${trackDetails.name} Track Shape" class="track-shape">
          </div>
        </div>
      </div>
    ` : ''}
  `;
  
  previewContainer.appendChild(a4Container);
  
  // Add print button
  // const printButtonContainer = document.createElement('div');
  // printButtonContainer.className = 'print-button-container';
  
  // const printButton = document.createElement('button');
  // printButton.className = 'print-button';
  // printButton.textContent = 'Download PDF';
  
  // printButton.addEventListener('click', () => {
  //   generatePDF();
  // });
  
  // printButtonContainer.appendChild(printButton);
  // document.body.appendChild(printButtonContainer);
  
  // Set the body to preview mode
  document.body.classList.add('preview-mode');
}

function groupByDate(scheduleItems) {
  const groups = {};
  scheduleItems.forEach(item => {
    if (!groups[item.date]) {
      groups[item.date] = [];
    }
    groups[item.date].push(item);
  });
  return Object.entries(groups);
}

// function generatePDF() {
//   // Clone the preview element to modify for PDF without affecting the view
//   const element = document.querySelector('.a4-preview').cloneNode(true);
  
//   // Apply PDF-specific styles to the clone
//   const pdfStyles = `
//     <style>
//       /* Reduce font sizes and spacing for PDF */
//       .a4-preview {
//         font-size: 10px !important;
//         line-height: 1.2 !important;
//       }
      
//       /* Scale down images */
//       .track-logo {
//         max-height: 60px !important;
//       }
      
//       .warning-image {
//         max-height: 30px !important;
//       }
      
//       /* Adjust section spacing */
//       .preview-section {
//         margin-bottom: 8px !important;
//       }
      
//       /* Make sure content fits on one page */
//       .a4-page-1 {
//         padding: 5mm !important;
//       }
      
//       /* Hide the track shape from first page */
//       .a4-page-1 .track-shape-container {
//         display: none !important;
//       }
      
//       /* Show full track shape on second page */
//       .a4-page-2 .track-shape {
//         max-height: 270mm !important;
//         width: auto !important;
//       }
//     </style>
//   `;
  
//   // Insert the styles at the beginning of the cloned element
//   element.insertAdjacentHTML('afterbegin', pdfStyles);
  
//   const opt = {
//     margin: 0,
//     filename: 'instruction-sheet.pdf',
//     image: { type: 'jpeg', quality: 0.98 },
//     html2canvas: { 
//       scale: 2,
//       ignoreElements: (element) => {
//         // Ignore the print button in the PDF
//         return element.classList && element.classList.contains('print-button-container');
//       }
//     },
//     jsPDF: { 
//       unit: 'mm', 
//       format: 'a4', 
//       orientation: 'portrait',
//       // Create a two-page PDF
//       putOnlyUsedFonts: true,
//       hotfixes: ["px_scaling"]
//     },
//     // Split content between two pages
//     pagebreak: { 
//       mode: ['avoid-all', 'css', 'legacy'],
//       before: '.a4-page-2'
//     }
//   };

//   // Use html2pdf library
//   html2pdf().set(opt).from(element).save();
// }

// Call this in your initApp function

async function initApp() {
  loadTheme();
  
  // Check for preview mode first
  if (checkForPreviewMode()) {
    return;
  }
  
  switchSection('instructions');
  await Promise.all([loadTracks(), loadInstructions()]);
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
      <td>${instruction.instructionName || instruction.trackName || 'Unnamed Instruction'}</td>
      <td>${dates}</td>
      <td class="actions">
        <button class="edit-btn" data-id="${id}">Edit</button>
        <button class="duplicate-btn" data-id="${id}">Duplicate</button>
        <button class="preview-btn" data-id="${id}">Preview</button>
        <button class="download-btn" data-id="${id}">Download PDF</button>
        <button class="delete-btn" data-id="${id}">Delete</button>
      </td>
    `;
    
    row.querySelector('.edit-btn').addEventListener('click', () => showInstructionModal(id));
    row.querySelector('.duplicate-btn').addEventListener('click', () => duplicateInstruction(id));
    row.querySelector('.preview-btn').addEventListener('click', () => previewInstruction(id));
    row.querySelector('.delete-btn').addEventListener('click', () => confirmDeleteInstruction(id));
    row.querySelector('.download-btn').addEventListener('click', () => downloadPDF(id));
    
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
  let currentInstructionId = instructionId;
  let instruction = {
  instructionName: '', // New field
  trackId: '',
  trackName: '',
  dates: [],
  overtakingRules: 'eitherSide',
  overtakingText1: '', // New field
  overtakingText2: '', // New field
  overtakingText1Second: '', // New field
  overtakingText2Second: '', // New field
  overtakingSecond: '', // New field
  noiseLimit: '',
  noiseLimitText: '', // New field
  noiseLimitTextSecond: '', // New field
  schedule: [{ startText: '', startText2: '', startTime: '09:00', endTime: '17:00', activity: 'Track Session', activity2: '', location: '' }],
  locations: [{ name: 'Reception', name2: '', address: '' }],
  notes: [{ text: '', text2: '', imageUrl: '' }],
  warnings: []
  };

  if (instructionId && instructions[instructionId]) {
    instruction = { 
      ...instructions[instructionId],
      notes: Array.isArray(instructions[instructionId].notes) ? 
        instructions[instructionId].notes : 
        [{ text: instructions[instructionId].notes || '', text2: '', imageUrl: '' }],
      warnings: Array.isArray(instructions[instructionId].warnings) ? 
        instructions[instructionId].warnings : 
        []
    };
  }

  const selectedDates = instruction.dates || [];
  const modal = createModal('Final Instruction Details');

  modal.content.innerHTML = `
  <form id="instructionForm">
    <!-- Instruction Name -->
    <div class="form-group">
      <label for="instructionName">Instruction Name</label>
      <input type="text" id="instructionName" class="form-input" 
             value="${instruction.instructionName || ''}" 
             placeholder="Give this instruction set a name" required>
    </div>

    <!-- Footer Selection -->
    <div class="form-group">
      <label for="footerImageUrl">Footer Image URL (optional)</label>
      <input type="url" id="footerImageUrl" class="form-input" 
             value="${instruction.footerImageUrl || ''}" 
             placeholder="https://example.com/footer-image.png">
      <div class="image-preview" id="footerImagePreview" 
           style="${instruction.footerImageUrl ? `background-image: url('${instruction.footerImageUrl}')` : ''}"></div>
    </div>

    <!-- Track Selection -->
    <div class="form-group">
      <label for="trackSelect">Select Track</label>
      <select id="trackSelect" class="form-input" required>
        <option value="">Select a track</option>
        ${Object.entries(tracks).map(([id, track]) => `
          <option value="${id}" ${instruction.trackId === id ? 'selected' : ''}>${track.name}</option>
        `).join('')}
      </select>
    </div>

    <!-- Dates Selection -->
    <div class="form-group">
      <label>Dates</label>
      <div id="calendarContainer" class="calendar-grid"></div>
      <div id="selectedDates"></div>
    </div>

    <!-- Overtaking Rules -->
    <div class="form-group">
      <label>Overtaking Rules</label>
      <input type="text" id="overtakingRulesLabel" class="form-input mb-10" value="${instruction.overtakingRulesLabel || 'Overtaking Rules'}" placeholder="Section Title (EN)">
      <input type="text" id="overtakingRulesLabel2" class="form-input" value="${instruction.overtakingRulesLabel2 || ''}" placeholder="Section Title (2nd lang - optional)">
      
      <div class="form-group">
        <label>Overtaking Text 1 (EN)</label>
        <input type="text" id="overtakingText1" class="form-input" value="${instruction.overtakingText1 || ''}">
      </div>
      
      <div class="form-group">
        <label>Overtaking Text 2 (EN)</label>
        <input type="text" id="overtakingText2" class="form-input" value="${instruction.overtakingText2 || ''}">
      </div>
      
      <div class="form-group">
        <label>Overtaking Text 1 (2nd)</label>
        <input type="text" id="overtakingText1Second" class="form-input" value="${instruction.overtakingText1Second || ''}">
      </div>
      
      <div class="form-group">
        <label>Overtaking Text 2 (2nd)</label>
        <input type="text" id="overtakingText2Second" class="form-input" value="${instruction.overtakingText2Second || ''}">
      </div>
      
      <div class="form-group">
        <label>Overtaking 2nd</label>
        <input type="text" id="overtakingSecond" class="form-input" value="${instruction.overtakingSecond || ''}">
      </div>
      
      <div class="overtaking-options">
        <label><input type="radio" name="overtakingRules" value="leftSideOnly" ${instruction.overtakingRules === 'leftSideOnly' ? 'checked' : ''}> Left Side Only</label>
        <label><input type="radio" name="overtakingRules" value="rightSideOnly" ${instruction.overtakingRules === 'rightSideOnly' ? 'checked' : ''}> Right Side Only</label>
        <label><input type="radio" name="overtakingRules" value="eitherSide" ${instruction.overtakingRules === 'eitherSide' ? 'checked' : ''}> Either Side</label>
      </div>
    </div>

    <!-- Noise Limit -->
    <div class="form-group">
      <label>Noise Limit</label>
      <input type="text" id="noiseLimitLabel" class="form-input mb-10" value="${instruction.noiseLimitLabel || 'Noise Limit'}" placeholder="Section Title (EN)">
      <input type="text" id="noiseLimitLabel2" class="form-input" value="${instruction.noiseLimitLabel2 || ''}" placeholder="Section Title (2nd lang - optional)">
      
      <div class="form-group">
        <label>Noise Limit Text (EN)</label>
        <input type="text" id="noiseLimitText" class="form-input" value="${instruction.noiseLimitText || ''}">
      </div>
      
      <div class="form-group">
        <label>Noise Limit Text (2nd)</label>
        <input type="text" id="noiseLimitTextSecond" class="form-input" value="${instruction.noiseLimitTextSecond || ''}">
      </div>
      
      <input type="number" id="noiseLimit" class="form-input" value="${instruction.noiseLimit || ''}" required>
    </div>

      <!-- Schedule -->
      <div class="form-group">
        <label>Schedule</label>
        <input type="text" id="scheduleLabel" class="form-input mb-10" value="${instruction.scheduleLabel || 'Daily Schedule'}" placeholder="Section Title (EN)">
        <input type="text" id="scheduleLabel2" class="form-input" value="${instruction.scheduleLabel2 || ''}" placeholder="Section Title (2nd lang - optional)">
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Text (EN)</th>
              <th>Text (2nd)</th>
              <th>Start</th>
              <th>End</th>
              <th>Activity (EN)</th>
              <th>Activity (2nd)</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="scheduleTableBody"></tbody>
        </table>
        <button type="button" id="addScheduleRowBtn" class="add-row-btn">Add Schedule Item</button>
      </div>

      <!-- Important Locations -->
      <div class="form-group">
        <label>Important Locations</label>
        <input type="text" id="locationsLabel" class="form-input mb-10" value="${instruction.locationsLabel || 'Important Locations'}" placeholder="Section Title (EN)">
        <input type="text" id="locationsLabel2" class="form-input" value="${instruction.locationsLabel2 || ''}" placeholder="Section Title (2nd lang - optional)">
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Name (EN)</th>
              <th>Name (2nd)</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="locationsTableBody"></tbody>
        </table>
        <button type="button" id="addLocationRowBtn" class="add-row-btn">Add Location</button>
      </div>

      <!-- Additional Notes -->
      <div class="form-group">
        <label>Additional Notes</label>
        <input type="text" id="notesLabel" class="form-input mb-10" value="${instruction.notesLabel || 'Additional Notes'}" placeholder="Section Title (EN)">
        <input type="text" id="notesLabel2" class="form-input" value="${instruction.notesLabel2 || ''}" placeholder="Section Title (2nd lang - optional)">
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Note (EN)</th>
              <th>Note (2nd lang)</th>
              <th>Image URL</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="notesTableBody"></tbody>
        </table>
        <button type="button" id="addNoteRowBtn" class="add-row-btn">Add Note</button>
      </div>

      <!-- Track Warnings -->
      <div class="form-group">
        <label>Track Warnings</label>
        <input type="text" id="warningsLabel" class="form-input mb-10" value="${instruction.warningsLabel || 'Track Warnings'}" placeholder="Section Title (EN)">
        <input type="text" id="warningsLabel2" class="form-input" value="${instruction.warningsLabel2 || ''}" placeholder="Section Title (2nd lang - optional)">
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Flag Name (EN)</th>
              <th>Flag Name (2nd)</th>
              <th>Image Link</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="warningsTableBody"></tbody>
        </table>
        <button type="button" id="addWarningRowBtn" class="add-row-btn">Add Warning</button>
      </div>

      <!-- Form buttons -->
      <div class="form-buttons">
        <button type="button" id="cancelInstructionBtn" class="delete-btn">Cancel</button>
        <button type="button" id="previewInstructionBtn" class="edit-btn">Preview</button>
        <button type="submit" class="edit-btn">Save Instruction</button>
      </div>
    </form>
  `;

  // Declare DOM elements
  const instructionForm = modal.content.querySelector('#instructionForm');
  const cancelBtn = modal.content.querySelector('#cancelInstructionBtn');
  const previewBtn = modal.content.querySelector('#previewInstructionBtn');
  const scheduleTableBody = modal.content.querySelector('#scheduleTableBody');
  const locationsTableBody = modal.content.querySelector('#locationsTableBody');
  const notesTableBody = modal.content.querySelector('#notesTableBody');
  const addScheduleRowBtn = modal.content.querySelector('#addScheduleRowBtn');
  const addLocationRowBtn = modal.content.querySelector('#addLocationRowBtn');
  const trackSelect = modal.content.querySelector('#trackSelect');
  const noiseLimit = modal.content.querySelector('#noiseLimit');
  const calendarContainer = modal.content.querySelector('#calendarContainer');
  const selectedDatesContainer = modal.content.querySelector('#selectedDates');
  const addNoteRowBtn = modal.content.querySelector('#addNoteRowBtn');
  const warningsTableBody = modal.content.querySelector('#warningsTableBody');
  const addWarningRowBtn = modal.content.querySelector('#addWarningRowBtn');

  // Validate DOM elements
  if (!calendarContainer || !selectedDatesContainer) {
    console.error('Error: #calendarContainer or #selectedDates element not found in modal content');
    showToast('Error: Failed to initialize calendar', 'error');
    return;
  }

  if (!warningsTableBody) {
    console.error('Error: #warningsTableBody element not found in modal content');
    showToast('Error: Failed to initialize warnings table', 'error');
    return;
  }

  // Initialize warnings table
  renderWarningsTable(warningsTableBody, instruction.warnings.length > 0 ? instruction.warnings : [{ name: '', name2: '', imageUrl: '' }]);

  addWarningRowBtn.addEventListener('click', () => {
    const newWarning = { name: '', name2: '', imageUrl: '' };
    const currentWarnings = getWarningsFromTable(warningsTableBody);
    renderWarningsTable(warningsTableBody, [...currentWarnings, newWarning]);
  });

  // Initialize calendar
  initCalendar(calendarContainer, selectedDatesContainer, selectedDates);

  // Populate schedule table
  renderScheduleTable(scheduleTableBody, instruction.schedule || [], selectedDates);

  // Populate locations table
  renderLocationsTable(locationsTableBody, instruction.locations || []);

  // Initialize notes table
  renderNotesTable(notesTableBody, instruction.notes);

  addNoteRowBtn.addEventListener('click', () => {
    const newNote = { text: '', text2: '', imageUrl: '' };
    const currentNotes = getNotesFromTable(notesTableBody);
    renderNotesTable(notesTableBody, [...currentNotes, newNote]);
  });

  cancelBtn.addEventListener('click', () => modal.close());

  previewBtn.addEventListener('click', () => {
    const formData = getInstructionFormData(
      instructionForm, 
      scheduleTableBody,
      locationsTableBody,
      selectedDatesContainer,
      notesTableBody,
      warningsTableBody
    );
    showInstructionPreview(formData);
  });

  instructionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = getInstructionFormData(
      instructionForm, 
      scheduleTableBody,
      locationsTableBody,
      selectedDatesContainer,
      notesTableBody,
      warningsTableBody
    );
    
    try {
      const idToUse = instructionId && typeof instructionId === 'string' ? instructionId : null;
      await saveInstruction(formData, idToUse);
      await loadInstructions();
      modal.close();
      showToast(`Instruction successfully ${idToUse ? 'updated' : 'created'}!`, 'success');
    } catch (error) {
      showToast('Error saving instruction: ' + error.message, 'error');
    }
  });

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

  const footerImageUrl = modal.content.querySelector('#footerImageUrl');
  const footerImagePreview = modal.content.querySelector('#footerImagePreview');
  footerImageUrl.addEventListener('input', () => {
    footerImagePreview.style.backgroundImage = `url('${footerImageUrl.value}')`;
  });

  addLocationRowBtn.addEventListener('click', () => {
    const newLocation = { name: '', name2: '', address: '' };
    const currentLocations = getLocationsFromTable(locationsTableBody);
    renderLocationsTable(locationsTableBody, [...currentLocations, newLocation]);
  });

  modal.show();
}

function renderWarningsTable(tableBody, warnings) {
  tableBody.innerHTML = '';
  warnings.forEach((warning, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" name="warningName" class="form-input" value="${warning.name || ''}" placeholder="Flag name (EN)"></td>
      <td><input type="text" name="warningName2" class="form-input" value="${warning.name2 || ''}" placeholder="Flag name (2nd lang)"></td>
      <td><input type="url" name="warningImageUrl" class="form-input" value="${warning.imageUrl || ''}" placeholder="Image URL"></td>
      <td>
        <button type="button" class="delete-btn">Remove</button>
      </td>
    `;
    row.querySelector('.delete-btn').addEventListener('click', () => {
      if (tableBody.querySelectorAll('tr').length > 1 || confirm('Remove the last warning?')) {
        row.remove();
      }
    });
    tableBody.appendChild(row);
  });
}

function getWarningsFromTable(tableBody) {
if (!tableBody) return [];

return Array.from(tableBody.querySelectorAll('tr')).map(row => {
  return {
    name: row.querySelector('input[name="warningName"]')?.value || '',
    name2: row.querySelector('input[name="warningName2"]')?.value || '',
    imageUrl: row.querySelector('input[name="warningImageUrl"]')?.value || ''
  };
}).filter(warning => warning.name || warning.name2 || warning.imageUrl);
}

function renderNotesTable(tableBody, notes) {
tableBody.innerHTML = '';

notes.forEach((note, index) => {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><textarea name="noteText" class="form-input" rows="2" placeholder="Note (EN)">${note.text || ''}</textarea></td>
    <td><textarea name="noteText2" class="form-input" rows="2" placeholder="Note (2nd lang)">${note.text2 || ''}</textarea></td>
    <td><input type="url" name="noteImageUrl" class="form-input" value="${note.imageUrl || ''}" placeholder="Image URL"></td>
    <td>
      <button type="button" class="delete-btn">Remove</button>
    </td>
  `;
  
  row.querySelector('.delete-btn').addEventListener('click', () => {
    if (tableBody.querySelectorAll('tr').length > 1 || confirm('Remove the last note?')) {
      row.remove();
    }
  });
  
  tableBody.appendChild(row);
});

// Add at least one row if empty
if (tableBody.querySelectorAll('tr').length === 0) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><textarea name="noteText" class="form-input" rows="2" placeholder="Note (EN)"></textarea></td>
    <td><textarea name="noteText2" class="form-input" rows="2" placeholder="Note (2nd lang)"></textarea></td>
    <td><input type="url" name="noteImageUrl" class="form-input" placeholder="Image URL"></td>
    <td>
      <button type="button" class="delete-btn">Remove</button>
    </td>
  `;
  
  row.querySelector('.delete-btn').addEventListener('click', () => {
    if (confirm('Remove the last note?')) {
      row.remove();
    }
  });
  
  tableBody.appendChild(row);
}
}

function getNotesFromTable(tableBody) {
if (!tableBody) return [];

return Array.from(tableBody.querySelectorAll('tr')).map(row => {
  const textEl = row.querySelector('textarea[name="noteText"]');
  const text2El = row.querySelector('textarea[name="noteText2"]');
  const imageUrlEl = row.querySelector('input[name="noteImageUrl"]');

  return {
    text: textEl ? textEl.value : '',
    text2: text2El ? text2El.value : '',
    imageUrl: imageUrlEl ? imageUrlEl.value : ''
  };
}).filter(note => note.text || note.text2 || note.imageUrl); // Filter out empty notes
}

function getInstructionFormData(form, scheduleTableBody, locationsTableBody, selectedDatesContainer, notesTableBody, warningsTableBody) {
  const trackSelect = form.querySelector('#trackSelect');
  const noiseLimit = form.querySelector('#noiseLimit');
  const overtakingRules = form.querySelector('input[name="overtakingRules"]:checked');

  // Basic validation
  if (!trackSelect || !noiseLimit || !overtakingRules || !notesTableBody) {
    throw new Error("Form elements not found");
  }

  const trackId = trackSelect.value;
  const trackName = trackSelect.options[trackSelect.selectedIndex]?.text || '';
  const noiseLimitValue = noiseLimit.value;
  const overtakingRulesValue = overtakingRules.value;

  // Get selected dates
  const selectedDates = Array.from(selectedDatesContainer.querySelectorAll('.selected-date'))
    .map(el => el.dataset.date)
    .filter(date => date); // Filter out any undefined dates

  // Get schedule
  const schedule = getScheduleFromTable(scheduleTableBody);

  // Get locations
  const locations = getLocationsFromTable(locationsTableBody);

  // Get notes
  const notes = getNotesFromTable(notesTableBody);

  // Get warnings
  const warnings = getWarningsFromTable(warningsTableBody);

  return {
    instructionName: form.querySelector('#instructionName').value, // New field
    trackId,
    trackName,
    dates: selectedDates,
    overtakingRules: overtakingRulesValue,
    overtakingRulesLabel: form.querySelector('#overtakingRulesLabel').value,
    overtakingRulesLabel2: form.querySelector('#overtakingRulesLabel2').value,
    overtakingText1: form.querySelector('#overtakingText1').value,
    overtakingText2: form.querySelector('#overtakingText2').value,
    overtakingText1Second: form.querySelector('#overtakingText1Second').value,
    overtakingText2Second: form.querySelector('#overtakingText2Second').value,
    overtakingSecond: form.querySelector('#overtakingSecond').value,
    noiseLimit: noiseLimitValue,
    noiseLimitLabel: form.querySelector('#noiseLimitLabel').value,
    noiseLimitLabel2: form.querySelector('#noiseLimitLabel2').value,
    noiseLimitText: form.querySelector('#noiseLimitText').value,
    noiseLimitTextSecond: form.querySelector('#noiseLimitTextSecond').value,
    schedule,
    scheduleLabel: form.querySelector('#scheduleLabel').value,
    scheduleLabel2: form.querySelector('#scheduleLabel2').value,
    locations,
    locationsLabel: form.querySelector('#locationsLabel').value,
    locationsLabel2: form.querySelector('#locationsLabel2').value,
    notes,
    notesLabel: form.querySelector('#notesLabel').value,
    notesLabel2: form.querySelector('#notesLabel2').value,
    warnings,
    warningsLabel: form.querySelector('#warningsLabel').value,
    warningsLabel2: form.querySelector('#warningsLabel2').value,
    schedule,
    scheduleLabel: form.querySelector('#scheduleLabel').value,
    scheduleLabel2: form.querySelector('#scheduleLabel2').value,
    locations,
    locationsLabel: form.querySelector('#locationsLabel').value,
    locationsLabel2: form.querySelector('#locationsLabel2').value,
    notes,
    notesLabel: form.querySelector('#notesLabel').value,
    notesLabel2: form.querySelector('#notesLabel2').value,
    warnings,
    warningsLabel: form.querySelector('#warningsLabel').value,
    warningsLabel2: form.querySelector('#warningsLabel2').value,
    footerImageUrl: form.querySelector('#footerImageUrl').value
  };
}

function getScheduleFromTable(tableBody) {
  return Array.from(tableBody.querySelectorAll('tr')).map(row => {
    return {
      date: row.querySelector('select[name="scheduleDate"]').value,
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

function renderScheduleTable(tableBody, scheduleItems, selectedDates) {
  tableBody.innerHTML = '';

  scheduleItems.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <select name="scheduleDate" class="form-input" required>
          ${selectedDates.map(date => `
            <option value="${date}" ${item.date === date ? 'selected' : ''}>
              ${new Date(date).toLocaleDateString()}
            </option>
          `).join('')}
        </select>
      </td>
      <td><input type="text" name="startText" class="form-input" value="${item.startText || ''}" placeholder="Optional text (EN)"></td>
      <td><input type="text" name="startText2" class="form-input" value="${item.startText2 || ''}" placeholder="Optional text (2nd lang)"></td>
      <td><input type="time" name="startTime" class="form-input" value="${item.startTime}" required></td>
      <td><input type="time" name="endTime" class="form-input" value="${item.endTime}" placeholder="Optional"></td>
      <td><input type="text" name="activity" class="form-input" value="${item.activity}" required placeholder="Activity (EN)"></td>
      <td><input type="text" name="activity2" class="form-input" value="${item.activity2 || ''}" placeholder="Activity (2nd lang)"></td>
      <td><input type="text" name="location" class="form-input" value="${item.location}" placeholder="Optional"></td>
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
  if (tableBody.querySelectorAll('tr').length === 0 && selectedDates.length > 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <select name="scheduleDate" class="form-input" required>
          ${selectedDates.map(date => `
            <option value="${date}">
              ${new Date(date).toLocaleDateString()}
            </option>
          `).join('')}
        </select>
      </td>
      <td><input type="text" name="startText" class="form-input" placeholder="Optional text (EN)"></td>
      <td><input type="text" name="startText2" class="form-input" placeholder="Optional text (2nd lang)"></td>
      <td><input type="time" name="startTime" class="form-input" value="09:00" required></td>
      <td><input type="time" name="endTime" class="form-input" value="17:00" placeholder="Optional"></td>
      <td><input type="text" name="activity" class="form-input" value="Track Session" required placeholder="Activity (EN)"></td>
      <td><input type="text" name="activity2" class="form-input" placeholder="Activity (2nd lang)"></td>
      <td><input type="text" name="location" class="form-input" placeholder="Optional"></td>
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
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  let selectedDates = [...initialSelectedDates];

  function renderCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

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
  const modal = createModal('Instruction Preview - A4 Layout');

  // Format dates for display
  const formattedDates = instruction.dates.map(date => new Date(date).toLocaleDateString()).join(', ');

  // Overtaking rules text
  let overtakingText = '';
  switch (instruction.overtakingRules) {
    case 'leftSideOnly': overtakingText = 'Left Side Only'; break;
    case 'rightSideOnly': overtakingText = 'Right Side Only'; break;
    case 'eitherSide': overtakingText = 'Either Side'; break;
  }

  modal.content.innerHTML = `
    <div class="instruction-preview a4-preview">
      <div class="a4-page">
        <!-- Page 1 -->
        <div class="a4-page-1">
          <!-- Left Section -->
          <div class="a4-left-section">
            <!-- Track Logo -->
            ${trackDetails?.logoUrl ? `
              <div class="track-logo-container">
                <img src="${trackDetails.logoUrl}" alt="${trackDetails.name} Logo" class="track-logo">
              </div>
            ` : ''}
            
            <!-- Schedule Section -->
            <div class="preview-section schedule-section">
              <div class="section-header red-bg">
                <div>${instruction.scheduleLabel || 'Schedule'}</div>
                ${instruction.scheduleLabel2 ? `<div class="secondary-language">${instruction.scheduleLabel2}</div>` : ''}
              </div>
              <div class="schedule-entries">
                <div class="schedule-header">
                  <div class="schedule-col time-col">Time</div>
                  <div class="schedule-col activity-col">Activity</div>
                  <div class="schedule-col location-col">Location</div>
                </div>
                ${groupByDate(instruction.schedule)
                  .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB)) // Sort dates newest to oldest
                  .map(([date, items]) => `
                    <div class="schedule-date-group">
                      <div class="section-subheader">
                        ${new Date(date).toLocaleDateString()} • ${instruction.trackName} ${instruction.eventName || ''}
                      </div>
                      ${items.map(item => `
                        <div class="schedule-entry">
                          <div class="schedule-col time-col">
                            ${item.startText || item.startText2 ? `
                              <div class="schedule-time-text">
                                ${item.startText ? `<span>${item.startText}</span>` : ''}
                                ${item.startText2 ? `<span class="secondary-language">${item.startText2}</span>` : ''}
                                ${item.startTime}${item.endTime ? ` – ${item.endTime}` : ''}
                              </div>
                            ` : `
                              <div class="schedule-time">${item.startTime}${item.endTime ? ` – ${item.endTime}` : ''}</div>
                            `}
                          </div>
                          <div class="schedule-col activity-col">
                            ${item.activity ? `<div>${item.activity}</div>` : ''}
                            ${item.activity2 ? `<div class="secondary-language">${item.activity2}</div>` : ''}
                          </div>
                          <div class="schedule-col location-col">
                            ${item.location ? `<div class="schedule-location">${item.location}</div>` : ''}
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  `).join('')}
              </div>
            </div>
            
            <!-- Important Locations Section -->
            <div class="preview-section locations-section">
              <div class="section-header orange-bg">
                <div>${instruction.locationsLabel || 'Important Locations'}</div>
                ${instruction.locationsLabel2 ? `<div class="secondary-language">${instruction.locationsLabel2}</div>` : ''}
              </div>
              <div class="locations-entries">
                ${instruction.locations.map(location => `
                  <div class="location-entry">
                    <div class="location-name">
                      <div>${location.name}</div>
                      ${location.name2 ? `<div class="secondary-language">${location.name2}</div>` : ''}
                    </div>
                    <div class="location-address">${location.address}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <!-- Overtaking Rules Section -->
            <div class="preview-section overtaking-section">
              <div class="section-header green-bg">
                <div>${instruction.overtakingRulesLabel || 'Overtaking Rules'}</div>
                ${instruction.overtakingRulesLabel2 ? `<div class="secondary-language">${instruction.overtakingRulesLabel2}</div>` : ''}
              </div>
              <div class="overtaking-content">
                ${instruction.overtakingText1 ? `<div class="overtaking-text">${instruction.overtakingText1} <span class="overtaking-rule">${overtakingText}</span> ${instruction.overtakingText2 || ''}</div>` : ''}
                ${instruction.overtakingText1Second ? `<div class="overtaking-text secondary-language">${instruction.overtakingText1Second} <span class="overtaking-rule">${overtakingText}</span> ${instruction.overtakingText2Second || ''}</div>` : ''}
              </div>
            </div>

            
            <!-- Track Warnings Section -->
            <div class="preview-section warnings-section">
              <div class="section-header yellow-bg">
                <div>${instruction.warningsLabel || 'Track Warnings'}</div>
                ${instruction.warningsLabel2 ? `<div class="secondary-language">${instruction.warningsLabel2}</div>` : ''}
              </div>
              <div class="warnings-grid">
                ${instruction.warnings.map(warning => `
                  <div class="warning-item">
                    ${warning.imageUrl ? `<img src="${warning.imageUrl}" alt="${warning.name || 'Warning flag'}" class="warning-image">` : ''}
                    <div class="warning-text">
                      <div>${warning.name}</div>
                      ${warning.name2 ? `<div class="secondary-language">${warning.name2}</div>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <div class="preview-footer">
              ${instruction.footerImageUrl ? `
                <img src="${instruction.footerImageUrl}" alt="Footer Image" class="footer-image">
              ` : ''}
            </div>
          </div>
          
          <!-- Right Section -->
          <div class="a4-right-section">
            <!-- Top Area -->
            <div class="right-top-area">
              <div class="track-name">${instruction.trackName} • ${instruction.instructionName} </div>
              <div class="event-dates">${formattedDates}</div>
            </div>
            
            <!-- Additional Notes Section -->
            <div class="preview-section notes-section">
              <div class="section-header blue-bg">
                <div>${instruction.notesLabel || 'Additional Notes'}</div>
                ${instruction.notesLabel2 ? `<div class="secondary-language">${instruction.notesLabel2}</div>` : ''}
              </div>
              <div class="notes-content">
                <!-- Noise Limit -->
                <div class="noise-limit-entry">
                  ${instruction.noiseLimitText ? `<div>${instruction.noiseLimitText}</div>` : ''}
                  ${instruction.noiseLimitTextSecond ? `<div class="secondary-language">${instruction.noiseLimitTextSecond}</div>` : ''}
                  <div class="noise-limit-value">${instruction.noiseLimit} dB</div>
                </div>
                
                <!-- Additional Notes -->
                ${instruction.notes.map(note => `
                  <div class="note-entry">
                    ${note.text ? `<div>${note.text.replace(/\n/g, '<br>')}</div>` : ''}
                    ${note.text2 ? `<div class="secondary-language">${note.text2.replace(/\n/g, '<br>')}</div>` : ''}
                    ${note.imageUrl ? `
                      <div class="note-image-container">
                        <img src="${note.imageUrl}" alt="Note image">
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Page 2 -->
        <div class="a4-page-2">
          ${trackDetails?.trackShapeUrl ? `
            <div class="track-shape-container">
              <img src="${trackDetails.trackShapeUrl}" alt="${trackDetails.name} Track Shape" class="track-shape">
            </div>
          ` : ''}
        </div>
      </div>
      
      <div class="form-buttons">
        <button type="button" id="closePreviewBtn" class="delete-btn">Close</button>
      </div>
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
    // Generate a unique URL for this preview
    const previewUrl = `${window.location.origin}${window.location.pathname}?preview=${instructionId}`;
    // Open in new tab (not window)
    const newTab = window.open(previewUrl, '_blank');
    if (!newTab) {
      showToast('Please allow popups for this site', 'error');
    }
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

async function downloadPDF(instructionId) {
  if (!instructions[instructionId]) return;

  try {
    const instruction = instructions[instructionId];
    const trackDetails = instruction.trackId ? tracks[instruction.trackId] : null;
    
    // Create a temporary container for PDF generation
    const element = document.createElement('div');
    element.className = 'pdf-container';
    
    // Format dates for filename
    const formattedDates = instruction.dates.map(date => new Date(date).toLocaleDateString('en-GB')).join('_');
    const filename = `${instruction.instructionName || instruction.trackName}_${formattedDates}.pdf`.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    // Generate the HTML content for the PDF with compact styling
    element.innerHTML = generatePDFContent(instruction, trackDetails);
    
    // Append to document temporarily for proper rendering
    document.body.appendChild(element);
    
    // PDF options with very narrow margins to maximize content space
    const opt = {
      margin: [3, 3, 3, 3], // Very narrow margins: [top, right, bottom, left] in mm
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true // Enable compression
      },
      pagebreak: { 
        mode: ['css', 'avoid-all'], // Changed order and removed 'legacy'
        before: '.explicit-page-break', // More specific class name
        avoid: '.no-break' // Added a class for elements that shouldn't break
      }
    };

    // Generate and download the PDF
    await html2pdf().set(opt).from(element).save();
    
    // Clean up
    document.body.removeChild(element);
    
  } catch (error) {
    showToast('Error generating PDF: ' + error.message, 'error');
    console.error('PDF generation error:', error);
  }
}

function generatePDFContent(instruction, trackDetails) {
  // Format dates for display
  const formattedDates = instruction.dates.map(date => new Date(date).toLocaleDateString()).join(', ');
  
  // Overtaking rules text
  let overtakingText = '';
  switch (instruction.overtakingRules) {
    case 'leftSideOnly': overtakingText = 'Left Side Only'; break;
    case 'rightSideOnly': overtakingText = 'Right Side Only'; break;
    case 'eitherSide': overtakingText = 'Either Side'; break;
  }
  
  // Helper function to group schedule by date
  function groupByDate(schedule) {
    const groups = {};
    schedule.forEach(item => {
      const date = item.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });
    return Object.entries(groups);
  }

  // Check if trackDetails is valid and has required properties
  const hasTrackShape = trackDetails && trackDetails.trackShapeUrl && trackDetails.trackShapeUrl.trim() !== '';
  const hasTrackLogo = trackDetails && trackDetails.logoUrl && trackDetails.logoUrl.trim() !== '';
  const trackName = trackDetails && trackDetails.name ? trackDetails.name : 'Track';

  return `
    <style>
      /* Base styles with strict control to avoid unwanted page breaks */
      .pdf-container {
        font-family: Arial, sans-serif;
        width: 210mm;
        font-size: 8pt;
        line-height: 1.1;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      /* First page container with fixed dimensions */
      .page-one {
        width: 210mm;
        box-sizing: border-box;
        position: relative;
        page-break-after: avoid;
        break-after: avoid;
        padding: 0;
        margin: 0;
        display: block;
        border: 1px solid red;
      }
      
      /* Explicit page break element */
      .explicit-page-break {
        display: block;
        page-break-before: always;
        break-before: page;
        height: 0;
        margin: 0;
        padding: 0;
        clear: both;
      }
      
      /* Second page container - Modified for full page track shape */
      .page-two {
        width: 210mm;
        height: 297mm;
        box-sizing: border-box;
        display: block;
        padding: 0;
        margin: 0;
        text-align: center;
        position: absolute;
        overflow: hidden;
        border: 1px solid red;
      }
      
      /* Layout sections - Using grid instead of flexbox for better PDF rendering */
      .page-content {
        display: grid;
        grid-template-columns: 48% 48%;
        column-gap: 2%;
        width: 100%;
        padding: 0;
        margin: 0;
      }
      
      .left-section {
        display: grid;
        grid-template-rows: auto auto auto auto 1fr;
        row-gap: 1mm;
        width: 100%;
        margin: 0;
        padding: 0;
      }
      
      .right-section {
        width: 100%;
        margin: 0;
        padding: 0;
      }
      
      /* Section headers */
      .section-header {
        color: white;
        font-weight: bold;
        padding: 1mm 1.5mm;
        margin: 0;
        font-size: 8.5pt;
      }
      
      .red-bg { background: #e74c3c; }
      .orange-bg { background: #f39c12; }
      .green-bg { background: #2ecc71; }
      .yellow-bg { background: #f1c40f; }
      .blue-bg { background: #3498db; }
      
      .section-subheader {
        color: #e74c3c;
        font-weight: bold;
        margin: 1mm 0;
        padding-bottom: 0.5mm;
        font-size: 8pt;
      }
      
      .secondary-language {
        color: #777;
        font-size: 7pt;
      }
      
      /* Schedule Entries Layout */
      .schedule-entries {
        width: 100%;
        margin-bottom: 2mm;
        font-size: 7.5pt;
      }

      .schedule-header {
        display: flex;
        font-weight: bold;
        padding: 0.5mm 0;
        border-bottom: 2px solid #e74c3c;
        margin-bottom: 1mm;
        text-align: center;
      }

      .schedule-date-group {
        margin-bottom: 1mm;
        vertical-align: middle
      }

      .schedule-date-header {
        font-weight: bold;
        color: #e74c3c;
        margin-bottom: 0.3mm;
        padding-bottom: 0.1mm;
      }

      .schedule-entry {
        display: flex;
        margin-bottom: 1mm;
        align-items: flex-start;
      }

      .schedule-col {
        padding: 0 0.2mm;
        text-align: center;

      }

      .time-col {
        flex: 0 0 20%;
        text-align: center;
      }

      .activity-col {
        flex: 1;
        text-align: center;
      }

      .location-col {
        flex: 0 0 20%;
        text-align: center;
      }

      .schedule-time {
        font-weight: bold;
        white-space: nowrap;
      }

      .schedule-time-text {
        font-weight: bold;
        margin-bottom: 0.1mm;
      }

      .schedule-activity div:first-child {
        font-weight: bold;
      }

      .schedule-activity div:not(:first-child) {
        margin-top: 0.1mm;
      }

      .schedule-location {
        font-size: 5pt;
        margin-top: 0.1mm;
      }

      /* For the header row */
      .schedule-header .time-col,
      .schedule-header .activity-col,
      .schedule-header .location-col {
        font-weight: bold;
        text-transform: uppercase;
        font-size: 7pt;
        color: #e74c3c;
      }
      
      /* Content items */
      .content-block {
        margin: 0 0 2mm 0;
      }
      
      .warning-item {
        display: flex;
        align-items: center;
        gap: 1mm;
        margin: 0;
        font-size: 5pt;
      }
      
      .warning-image {
        width: 6mm;
        height: 6mm;
      }
      
      .note-entry {
        margin: 0 0 1.5mm 0;
        font-size: 7.5pt;
      }
      
      /* Modified track shape styling for full page */
      .track-shape-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0;
        margin: 0;
      }
      
      .track-shape {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
      }
      
      .track-title {
        position: absolute;
        top: 5mm;
        left: 0;
        width: 100%;
        text-align: center;
        margin: 0;
        padding: 0;
        font-size: 14pt;
        font-weight: bold;
        color: #333;
        z-index: 1;
      }
      
      .track-logo {
        max-height: 15mm !important;
        margin-bottom: 1mm;
      }
      
      .footer-container {
        margin-top: auto;
        align-self: end;
        text-align: center;
      }
      
      .footer-image {
        max-height: 100%;
        max-width: 100%;
        object-fit: contain;
      }
      
      .track-name {
        font-size: 10pt !important;
        margin-bottom: 1mm;
        font-weight: bold;
      }
      
      /* Grid for warnings */
      .warnings-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1mm;
        margin: 0;
      }
      
      .overtaking-rule {
        font-weight: bold;
        color: #e74c3c;
      }
      
      .noise-limit-value {
        font-weight: bold;
        margin-top: 0.5mm;
      }
        
      .schedule-time-text {
        font-weight: bold;
        margin-bottom: 1mm;
      }

      .note-image-container {
        margin: 0;
      }

      .note-image-container img {
        max-width: 100%;
        max-height: 20mm;
        object-fit: contain;
      }
      
      /* Page settings */
      @page {
        size: A4;
        margin: 0;
      }

      /* No page breaks inside content blocks */
      .no-break {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      /* Force every part of content to avoid page breaks */
      .section-header, .content-block, .note-entry, .warning-item, 
      .schedule-row, .section-subheader, table, tr, td, th {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    </style>

    <!-- Page 1 -->
    <div class="page-one">
      <div class="page-content">
        <!-- Left Section -->
        <div class="left-section">
          <!-- Track Logo -->
          ${hasTrackLogo ? `
            <div style="text-align: center; margin-bottom: 1mm;">
              <img src="${trackDetails.logoUrl}" alt="${trackName} Logo" class="track-logo no-break" style="max-height: 15mm;">
            </div>
          ` : ''}
          
          <!-- Schedule Section -->
          <div class="content-block no-break">
            <div class="section-header red-bg">
              <div>${instruction.scheduleLabel || 'Schedule'}</div>
              ${instruction.scheduleLabel2 ? `<div class="secondary-language">${instruction.scheduleLabel2}</div>` : ''}
            </div>
            <div class="schedule-entries">
              <div class="schedule-header">
                <div class="schedule-col time-col">Time</div>
                <div class="schedule-col activity-col">Activity</div>
                <div class="schedule-col location-col">Location</div>
              </div>
              ${groupByDate(instruction.schedule)
                .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                .map(([date, items]) => `
                  <div class="schedule-date-group">
                    <div class="schedule-date-header">
                      ${new Date(date).toLocaleDateString()} • ${instruction.trackName} ${instruction.eventName || ''}
                    </div>
                    ${items.map(item => `
                      <div class="schedule-entry">
                        <div class="schedule-col time-col">
                          ${item.startText || item.startText2 ? `
                            <div class="schedule-time-text">
                              ${item.startText ? `<span>${item.startText}</span>` : ''}
                              ${item.startText2 ? `<span class="secondary-language">${item.startText2}</span>` : ''}
                              ${item.startTime}${item.endTime ? ` – ${item.endTime}` : ''}
                            </div>
                          ` : `
                            <div class="schedule-time">${item.startTime}${item.endTime ? ` – ${item.endTime}` : ''}</div>
                          `}
                        </div>
                        <div class="schedule-col activity-col">
                          ${item.activity ? `<div>${item.activity}</div>` : ''}
                          ${item.activity2 ? `<div class="secondary-language">${item.activity2}</div>` : ''}
                        </div>
                        <div class="schedule-col location-col">
                          ${item.location ? `<div class="schedule-location">${item.location}</div>` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `).join('')}
            </div>
          </div>
          
          <!-- Important Locations Section -->
          <div class="content-block no-break">
            <div class="section-header orange-bg">
              <div>${instruction.locationsLabel || 'Important Locations'}</div>
              ${instruction.locationsLabel2 ? `<div class="secondary-language">${instruction.locationsLabel2}</div>` : ''}
            </div>
            ${instruction.locations.map(location => `
              <div style="margin-bottom: 1mm; font-size: 7.5pt;">
                <div>
                  <strong>${location.name}</strong>
                  ${location.name2 ? `<span class="secondary-language"> / ${location.name2}</span>` : ''}
                </div>
                <div>${location.address}</div>
              </div>
            `).join('')}
          </div>
          
          <!-- Overtaking Rules Section -->
          <div class="content-block no-break">
            <div class="section-header green-bg">
              <div>${instruction.overtakingRulesLabel || 'Overtaking Rules'}</div>
              ${instruction.overtakingRulesLabel2 ? `<div class="secondary-language">${instruction.overtakingRulesLabel2}</div>` : ''}
            </div>
            <div style="font-size: 7.5pt;">
              ${instruction.overtakingText1 ? `<div>${instruction.overtakingText1} <span class="overtaking-rule">${overtakingText}</span> ${instruction.overtakingText2 || ''}</div>` : ''}
              ${instruction.overtakingText1Second ? `<div class="secondary-language">${instruction.overtakingText1Second} <span class="overtaking-rule">${instruction.overtakingSecond || ''}</span> ${instruction.overtakingText2Second || ''}</div>` : ''}
            </div>
          </div>
          
          <!-- Footer - placed at the bottom using grid -->
          <div class="footer-container no-break">
            ${instruction.footerImageUrl ? `
              <img src="${instruction.footerImageUrl}" alt="Footer Image" class="footer-image">
            ` : ''}
          </div>
        </div>
        
        <!-- Right Section -->
        <div class="right-section">
          <!-- Top Area -->
          <div style="margin-bottom: 12mm;" class="no-break">
            <div class="track-name">${instruction.trackName} • ${instruction.instructionName}</div>
            <div style="color: #777; font-size: 7.5pt;">${formattedDates}</div>
          </div>

          <!-- Track Warnings Section -->
          <div class="content-block no-break">
            <div class="section-header yellow-bg">
              <div>${instruction.warningsLabel || 'Track Warnings'}</div>
              ${instruction.warningsLabel2 ? `<div class="secondary-language">${instruction.warningsLabel2}</div>` : ''}
            </div>
            <div class="warnings-grid">
              ${instruction.warnings.map(warning => `
                <div class="warning-item">
                  ${warning.imageUrl ? `
                    <img src="${warning.imageUrl}" alt="${warning.name || 'Warning flag'}" class="warning-image">` : ''}
                  <div>
                    <div>${warning.name}</div>
                    ${warning.name2 ? `<div style="font-size: 5pt;" class="secondary-language">${warning.name2}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Additional Notes Section -->
          <div style="margin-top: 2mm;" class="no-break">
            <div class="section-header blue-bg">
              <div>${instruction.notesLabel || 'Additional Notes'}</div>
              ${instruction.notesLabel2 ? `<div class="secondary-language">${instruction.notesLabel2}</div>` : ''}
            </div>
            <!-- Noise Limit -->
            ${instruction.noiseLimit ? `
              <div style="margin-bottom: 1mm; font-size: 7.5pt;">
                  ${instruction.noiseLimitText ? `<div>${instruction.noiseLimitText}${instruction.noiseLimitTextSecond ? ` <span class="secondary-language">/ ${instruction.noiseLimitTextSecond}</span>` : ''}</div>` : ''}
                  <div class="noise-limit-value">${instruction.noiseLimit} dB</div>
                </div>
              ` : ''}
            
              <!-- Additional Notes -->
              ${instruction.notes && instruction.notes.length ? instruction.notes.map(note => `
                <div class="note-entry no-break">
                  ${note.text ? `<div>${note.text}${note.text2 ? ` <span class="secondary-language">/ ${note.text2}</span>` : ''}</div>` : ''}
                  ${note.imageUrl ? `
                    <div class="note-image-container">
                      <img src="${note.imageUrl}" alt="Note image">
                    </div>
                  ` : ''}
                </div>
              `).join('') : ''}
          </div>
        </div>
      </div>
      <div class="explicit-page-break"></div>
    </div>

    <!-- Always add the page break and second page if there's a track shape to display -->
    ${hasTrackShape ? `
      <!-- Page 2 - Full page Track Shape -->
      <div class="page-two">
        <div class="track-shape-container">
          <img 
            src="${trackDetails.trackShapeUrl}" 
            alt="${trackName} Track Shape" 
            class="track-shape"
            style="width: 100%; height: 100%; object-fit: contain;"
          >
        </div>
      </div>
    ` : ''}
  `;
}

// Export functions for potential use in other modules
export {
loadTracks,
loadInstructions,
showInstructionModal,
showTrackModal,
previewInstruction
};
