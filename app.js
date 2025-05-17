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
      
      /* Second page container */
      .page-two {
        width: 210mm;
        box-sizing: border-box;
        display: block;
        padding: 0;
        margin: 0;
        text-align: center;
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
        row-gap: 2mm;
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
        border-bottom: 1px solid #ddd;
        font-size: 8pt;
      }
      
      .secondary-language {
        color: #777;
        font-size: 7pt;
      }
      
      /* Schedule table improvements */
      .schedule-table {
        width: 100%;
        font-size: 7.5pt;
        margin: 0;
        border-collapse: collapse;
      }
      
      .schedule-header-row {
        font-weight: bold;
      }
      
      .schedule-header-cell {
        padding: 0.5mm;
        text-align: center;
      }
      
      .schedule-date-group {
        margin: 0;
      }
      
      .schedule-row {
        border-bottom: 1px solid #eee;
      }
      
      .schedule-cell {
        padding: 0.5mm;
        vertical-align: top;
      }
      
      .time-cell {
        width: 20%;
        text-align: center;
      }
      
      .activity-cell {
        width: 50%;
        text-align: center;
      }
      
      .location-cell {
        width: 30%;
        text-align: center;
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
      
      .track-shape {
        max-width: 200mm;
        max-height: 280mm;
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
          ${trackDetails?.logoUrl ? `
            <div style="text-align: center; margin-bottom: 1mm;">
              <img src="${trackDetails.logoUrl}" alt="${trackDetails.name} Logo" class="track-logo no-break" style="max-height: 15mm;">
            </div>
          ` : ''}
          
          <!-- Schedule Section -->
          <div class="content-block no-break">
            <div class="section-header red-bg">
              <div>${instruction.scheduleLabel || 'Schedule'}</div>
              ${instruction.scheduleLabel2 ? `<div class="secondary-language">${instruction.scheduleLabel2}</div>` : ''}
            </div>
            <table class="schedule-table">
              <thead>
                <tr class="schedule-header-row">
                  <th class="schedule-header-cell time-cell">Time</th>
                  <th class="schedule-header-cell activity-cell">Activity</th>
                  <th class="schedule-header-cell location-cell">Location</th>
                </tr>
              </thead>
              <tbody>
                ${groupByDate(instruction.schedule)
                  .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                  .map(([date, items]) => `
                    <tr>
                      <td colspan="3" class="section-subheader">
                        ${new Date(date).toLocaleDateString()} • ${instruction.trackName} ${instruction.eventName || ''}
                      </td>
                    </tr>
                    ${items.map(item => `
                      <tr class="schedule-row">
                        <td class="schedule-cell time-cell">
                          ${item.startText || item.startText2 ? `
                            <div class="schedule-time-text">
                              ${item.startText ? `<span>${item.startText}</span>` : ''}
                              ${item.startText2 ? `<span class="secondary-language">${item.startText2}</span>` : ''}
                              ${item.startTime}${item.endTime ? ` – ${item.endTime}` : ''}
                            </div>
                          ` : `
                            <div class="schedule-time">${item.startTime}${item.endTime ? ` – ${item.endTime}` : ''}</div>
                          `}
                        </td>
                        <td class="schedule-cell activity-cell">
                          ${item.activity ? `<div>${item.activity}</div>` : ''}
                          ${item.activity2 ? `<div class="secondary-language">${item.activity2}</div>` : ''}
                        </td>
                        <td class="schedule-cell location-cell">
                          ${item.location ? `<div>${item.location}</div>` : ''}
                        </td>
                      </tr>
                    `).join('')}
                  `).join('')}
              </tbody>
            </table>
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
    </div>

    <!-- Only add the page break and second page if there's a track shape to display -->
    ${trackDetails?.trackShapeUrl ? `
      <!-- Explicit page break -->
      <div class="explicit-page-break"></div>
      
      <!-- Page 2 - Track Shape -->
      <div class="page-two no-break">
        <img src="${trackDetails.trackShapeUrl}" alt="${trackDetails.name} Track Shape" class="track-shape">
      </div>
    ` : ''}
  `;
}
