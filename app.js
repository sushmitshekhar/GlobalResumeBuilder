/* ============================================================
   GlobalPath Resume Builder — app.js
   Complete standalone CV builder logic with live preview,
   ATS scoring, templates, and localStorage persistence.
   ============================================================ */

// ---- State ----
let cvExperienceEntries = [
  {
    role: 'Senior Software Engineer',
    company: 'TechCorp Solutions',
    location: 'Bengaluru, India',
    startDate: '2021-01',
    endDate: 'Present',
    achievements: '• Led a team of 8 engineers to build a microservices platform serving 2M+ daily users\n• Reduced API latency by 40% through query optimization and Redis caching\n• Designed CI/CD pipelines using GitHub Actions, reducing deployment time by 60%'
  },
  {
    role: 'Software Engineer',
    company: 'InnovateTech Pvt. Ltd.',
    location: 'Pune, India',
    startDate: '2018-06',
    endDate: '2020-12',
    achievements: '• Developed RESTful APIs in Node.js serving 500K+ requests/day\n• Implemented real-time notification system using WebSockets\n• Mentored 3 junior developers and conducted weekly code reviews'
  }
];

let cvEducationEntries = [
  {
    degree: 'B.Tech in Computer Science & Engineering',
    institution: 'Indian Institute of Technology, Delhi',
    location: 'New Delhi, India',
    startDate: '2014-08',
    endDate: '2018-05',
    details: 'CGPA: 8.7/10 — Dean\'s List 2016, 2017'
  }
];

let cvTemplate = 'modern';
let cvAccentColor = '#1e3a8a';
let cvZoom = 100;

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  setupCVBuilder();
});

// ---- Setup ----
function setupCVBuilder() {
  // Simple input fields
  const simpleFields = [
    'cvName', 'cvTitle', 'cvEmail', 'cvPhone',
    'cvLinkedin', 'cvGithub', 'cvLocation', 'cvWebsite',
    'cvVisaNote', 'cvSummary', 'cvSkills', 'cvLanguages',
    'cvCertifications', 'cvProjects'
  ];

  simpleFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', onCVChange);
    }
  });

  // Summary char counter
  const summaryEl = document.getElementById('cvSummary');
  const counterEl = document.getElementById('summaryCharCounter');
  if (summaryEl && counterEl) {
    summaryEl.addEventListener('input', () => {
      counterEl.textContent = `${summaryEl.value.length} / 600`;
    });
  }

  // Accordion toggle
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.accordion-section').classList.toggle('open');
    });
  });

  // Theme toggle
  const themeToggle = document.getElementById('btnThemeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
      themeToggle.innerHTML = isDark ? '🌙' : '☀️';
      localStorage.setItem('globalpath_theme', isDark ? 'light' : 'dark');
    });
    // Load theme
    const savedTheme = localStorage.getItem('globalpath_theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.innerHTML = '☀️';
    }
  }

  // Template switcher
  const templateSwitcher = document.getElementById('templateSwitcher');
  if (templateSwitcher) {
    templateSwitcher.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        templateSwitcher.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        cvTemplate = btn.dataset.template;
        onCVChange();
      });
    });
  }

  // Color picker
  const colorPicker = document.getElementById('colorPicker');
  if (colorPicker) {
    colorPicker.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        colorPicker.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        cvAccentColor = dot.dataset.color;
        onCVChange();
      });
    });
  }

  // Zoom controls
  const zoomIn = document.getElementById('btnZoomIn');
  const zoomOut = document.getElementById('btnZoomOut');
  if (zoomIn) zoomIn.addEventListener('click', () => { cvZoom = Math.min(150, cvZoom + 10); applyZoom(); });
  if (zoomOut) zoomOut.addEventListener('click', () => { cvZoom = Math.max(50, cvZoom - 10); applyZoom(); });

  // Add experience / education buttons
  const addExpBtn = document.getElementById('btnAddExperience');
  if (addExpBtn) {
    addExpBtn.addEventListener('click', () => {
      cvExperienceEntries.push({ role: '', company: '', location: '', startDate: '', endDate: '', achievements: '' });
      renderExperienceEntries();
      onCVChange();
    });
  }

  const addEduBtn = document.getElementById('btnAddEducation');
  if (addEduBtn) {
    addEduBtn.addEventListener('click', () => {
      cvEducationEntries.push({ degree: '', institution: '', location: '', startDate: '', endDate: '', details: '' });
      renderEducationEntries();
      onCVChange();
    });
  }

  // Action buttons
  const copyBtn = document.getElementById('btnCopyMarkdown');
  if (copyBtn) copyBtn.addEventListener('click', copyMarkdownCV);

  const downloadBtn = document.getElementById('btnDownload');
  if (downloadBtn) downloadBtn.addEventListener('click', downloadPDF);

  const saveBtn = document.getElementById('btnSaveDraft');
  if (saveBtn) saveBtn.addEventListener('click', saveCVDraft);

  const loadBtn = document.getElementById('btnLoadDraft');
  if (loadBtn) loadBtn.addEventListener('click', loadCVDraft);

  // Audit Resume Modal & Upload
  const uploadBtn = document.getElementById('btnUploadResume');
  const uploadInput = document.getElementById('pdfUploadInput');
  const modal = document.getElementById('auditModal');
  const closeBtn = document.getElementById('btnCloseModal');

  if (uploadBtn && uploadInput) {
    uploadBtn.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', handlePDFUpload);
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    // Close on click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  // Initial render
  renderExperienceEntries();
  renderEducationEntries();
  onCVChange();
}

// ---- Core handlers ----
function onCVChange() {
  renderCVPreview();
  updateATSScore();
}

function applyZoom() {
  const paper = document.getElementById('cvPreviewPaper');
  const levelEl = document.getElementById('zoomLevel');
  if (paper) paper.style.transform = `scale(${cvZoom / 100})`;
  if (levelEl) levelEl.textContent = `${cvZoom}%`;
}

// ============================================================
// EXPERIENCE ENTRIES
// ============================================================
function renderExperienceEntries() {
  const container = document.getElementById('experienceEntries');
  if (!container) return;
  container.innerHTML = '';
  cvExperienceEntries.forEach((entry, idx) => {
    container.appendChild(createExperienceCard(entry, idx));
  });
}

function createExperienceCard(entry, idx) {
  const card = document.createElement('div');
  card.className = 'entry-card';

  card.innerHTML = `
    <div class="entry-card-header">
      <div class="entry-card-title">
        <i class="fa-solid fa-briefcase"></i>
        <span>${entry.role || `Experience #${idx + 1}`}</span>
      </div>
      <div class="entry-card-actions">
        <button class="entry-action-btn move" title="Move Up" data-action="up"><i class="fa-solid fa-arrow-up"></i></button>
        <button class="entry-action-btn move" title="Move Down" data-action="down"><i class="fa-solid fa-arrow-down"></i></button>
        <button class="entry-action-btn delete" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label>Role / Title</label>
        <input type="text" data-field="role" value="${esc(entry.role)}" placeholder="e.g. Senior Software Engineer" />
      </div>
      <div class="form-group">
        <label>Company</label>
        <input type="text" data-field="company" value="${esc(entry.company)}" placeholder="e.g. TechCorp Solutions" />
      </div>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label>Location</label>
        <input type="text" data-field="location" value="${esc(entry.location)}" placeholder="e.g. Bengaluru, India" />
      </div>
      <div class="form-group" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <div>
          <label>Start</label>
          <input type="text" data-field="startDate" value="${esc(entry.startDate)}" placeholder="2021-01" />
        </div>
        <div>
          <label>End</label>
          <input type="text" data-field="endDate" value="${esc(entry.endDate)}" placeholder="Present" />
        </div>
      </div>
    </div>
    <div class="form-group">
      <label>Achievements <span class="label-hint">One per line, use bullet points (•)</span></label>
      <textarea data-field="achievements" rows="4" placeholder="• Led a team of 8 engineers...">${esc(entry.achievements)}</textarea>
    </div>
  `;

  // Wire inputs
  card.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', () => {
      cvExperienceEntries[idx][input.dataset.field] = input.value;
      // Update card title live
      if (input.dataset.field === 'role') {
        card.querySelector('.entry-card-title span').textContent = input.value || `Experience #${idx + 1}`;
      }
      onCVChange();
    });
  });

  // Wire action buttons
  card.querySelector('[data-action="up"]').addEventListener('click', () => {
    if (idx > 0) { swapEntries(cvExperienceEntries, idx, idx - 1); renderExperienceEntries(); onCVChange(); }
  });
  card.querySelector('[data-action="down"]').addEventListener('click', () => {
    if (idx < cvExperienceEntries.length - 1) { swapEntries(cvExperienceEntries, idx, idx + 1); renderExperienceEntries(); onCVChange(); }
  });
  card.querySelector('.delete').addEventListener('click', () => {
    cvExperienceEntries.splice(idx, 1);
    renderExperienceEntries();
    onCVChange();
  });

  return card;
}

// ============================================================
// EDUCATION ENTRIES
// ============================================================
function renderEducationEntries() {
  const container = document.getElementById('educationEntries');
  if (!container) return;
  container.innerHTML = '';
  cvEducationEntries.forEach((entry, idx) => {
    container.appendChild(createEducationCard(entry, idx));
  });
}

function createEducationCard(entry, idx) {
  const card = document.createElement('div');
  card.className = 'entry-card';

  card.innerHTML = `
    <div class="entry-card-header">
      <div class="entry-card-title">
        <i class="fa-solid fa-graduation-cap"></i>
        <span>${entry.degree || `Education #${idx + 1}`}</span>
      </div>
      <div class="entry-card-actions">
        <button class="entry-action-btn move" title="Move Up" data-action="up"><i class="fa-solid fa-arrow-up"></i></button>
        <button class="entry-action-btn move" title="Move Down" data-action="down"><i class="fa-solid fa-arrow-down"></i></button>
        <button class="entry-action-btn delete" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label>Degree / Program</label>
        <input type="text" data-field="degree" value="${esc(entry.degree)}" placeholder="e.g. B.Tech in Computer Science" />
      </div>
      <div class="form-group">
        <label>Institution</label>
        <input type="text" data-field="institution" value="${esc(entry.institution)}" placeholder="e.g. IIT Delhi" />
      </div>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label>Location</label>
        <input type="text" data-field="location" value="${esc(entry.location)}" placeholder="e.g. New Delhi, India" />
      </div>
      <div class="form-group" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <div>
          <label>Start</label>
          <input type="text" data-field="startDate" value="${esc(entry.startDate)}" placeholder="2014-08" />
        </div>
        <div>
          <label>End</label>
          <input type="text" data-field="endDate" value="${esc(entry.endDate)}" placeholder="2018-05" />
        </div>
      </div>
    </div>
    <div class="form-group">
      <label>Additional Details <span class="label-hint">GPA, honors, relevant coursework</span></label>
      <input type="text" data-field="details" value="${esc(entry.details)}" placeholder="e.g. CGPA: 8.7/10 — Dean's List" />
    </div>
  `;

  // Wire inputs
  card.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      cvEducationEntries[idx][input.dataset.field] = input.value;
      if (input.dataset.field === 'degree') {
        card.querySelector('.entry-card-title span').textContent = input.value || `Education #${idx + 1}`;
      }
      onCVChange();
    });
  });

  // Wire action buttons
  card.querySelector('[data-action="up"]').addEventListener('click', () => {
    if (idx > 0) { swapEntries(cvEducationEntries, idx, idx - 1); renderEducationEntries(); onCVChange(); }
  });
  card.querySelector('[data-action="down"]').addEventListener('click', () => {
    if (idx < cvEducationEntries.length - 1) { swapEntries(cvEducationEntries, idx, idx + 1); renderEducationEntries(); onCVChange(); }
  });
  card.querySelector('.delete').addEventListener('click', () => {
    cvEducationEntries.splice(idx, 1);
    renderEducationEntries();
    onCVChange();
  });

  return card;
}

// ============================================================
// HELPERS
// ============================================================
function swapEntries(arr, i, j) {
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// ATS SCORE
// ============================================================
function updateATSScore() {
  const checks = [];
  const val = id => (document.getElementById(id)?.value || '').trim();

  // 1. Name
  checks.push({
    label: 'Full Name',
    pass: val('cvName').length > 2,
    tip: val('cvName').length > 2 ? 'Name provided' : 'Add your full name'
  });

  // 2. Professional Title
  checks.push({
    label: 'Job Title',
    pass: val('cvTitle').length > 2,
    tip: val('cvTitle').length > 2 ? 'Title set' : 'Add a professional title'
  });

  // 3. Contact info (email or phone)
  const hasContact = val('cvEmail').length > 3 || val('cvPhone').length > 5;
  checks.push({
    label: 'Contact Info',
    pass: hasContact,
    tip: hasContact ? 'Contact details present' : 'Add email or phone'
  });

  // 4. LinkedIn
  checks.push({
    label: 'LinkedIn',
    pass: val('cvLinkedin').includes('linkedin'),
    tip: val('cvLinkedin').includes('linkedin') ? 'LinkedIn linked' : 'Add LinkedIn URL'
  });

  // 5. Summary length (>100 chars)
  const summaryLen = val('cvSummary').length;
  checks.push({
    label: 'Summary',
    pass: summaryLen >= 100,
    warn: summaryLen > 0 && summaryLen < 100,
    tip: summaryLen >= 100 ? 'Strong summary' : summaryLen > 0 ? `Summary too short (${summaryLen}/100)` : 'Write a professional summary'
  });

  // 6. Skills count (>=5)
  const skillsCount = val('cvSkills').split(',').filter(s => s.trim()).length;
  checks.push({
    label: 'Skills',
    pass: skillsCount >= 5,
    warn: skillsCount > 0 && skillsCount < 5,
    tip: skillsCount >= 5 ? `${skillsCount} skills listed` : `Add more skills (${skillsCount}/5 min)`
  });

  // 7. Experience detail
  const hasExpDetail = cvExperienceEntries.some(e => e.role && e.achievements.length > 20);
  checks.push({
    label: 'Experience',
    pass: hasExpDetail,
    tip: hasExpDetail ? 'Detailed experience' : 'Add detailed work experience'
  });

  // 8. Education
  const hasEdu = cvEducationEntries.some(e => e.degree && e.institution);
  checks.push({
    label: 'Education',
    pass: hasEdu,
    tip: hasEdu ? 'Education listed' : 'Add education details'
  });

  // 9. Visa note
  checks.push({
    label: 'Visa Note',
    pass: val('cvVisaNote').length > 5,
    tip: val('cvVisaNote').length > 5 ? 'Visa info included' : 'Add nationality/visa note'
  });

  // 10. Certifications
  const certCount = val('cvCertifications').split('\n').filter(l => l.trim()).length;
  checks.push({
    label: 'Certifications',
    pass: certCount > 0,
    tip: certCount > 0 ? `${certCount} cert(s) listed` : 'Add certifications'
  });

  // 11. Languages
  const langCount = val('cvLanguages').split(',').filter(l => l.trim()).length;
  checks.push({
    label: 'Languages',
    pass: langCount >= 1,
    tip: langCount >= 1 ? `${langCount} language(s)` : 'List languages spoken'
  });

  // Calculate score
  const passed = checks.filter(c => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);

  // Update DOM
  const percentEl = document.getElementById('atsPercentage');
  const fillEl = document.getElementById('atsFill');
  const tipsEl = document.getElementById('atsTips');

  if (percentEl) percentEl.textContent = `${score}%`;
  if (fillEl) fillEl.style.width = `${score}%`;

  if (tipsEl) {
    tipsEl.innerHTML = checks.map(c => {
      const cls = c.pass ? 'pass' : (c.warn ? 'warn' : 'fail');
      const icon = c.pass ? 'fa-circle-check' : (c.warn ? 'fa-triangle-exclamation' : 'fa-circle-xmark');
      return `<span class="ats-tip ${cls}"><i class="fa-solid ${icon}"></i> ${c.tip}</span>`;
    }).join('');
  }
}

// ============================================================
// CV PREVIEW RENDERING
// ============================================================
function renderCVPreview() {
  const paper = document.getElementById('cvPreviewPaper');
  if (!paper) return;

  const val = id => (document.getElementById(id)?.value || '').trim();
  const name = val('cvName');
  const title = val('cvTitle');
  const email = val('cvEmail');
  const phone = val('cvPhone');
  const linkedin = val('cvLinkedin');
  const github = val('cvGithub');
  const location = val('cvLocation');
  const website = val('cvWebsite');
  const visaNote = val('cvVisaNote');
  const summary = val('cvSummary');
  const skills = val('cvSkills');
  const languages = val('cvLanguages');
  const certifications = val('cvCertifications');
  const projects = val('cvProjects');

  // Check if anything is filled
  const hasContent = name || title || summary || skills || cvExperienceEntries.some(e => e.role);
  if (!hasContent) {
    paper.innerHTML = '<p class="preview-placeholder"><i class="fa-solid fa-file-circle-plus"></i> Start filling in your details to see the preview</p>';
    // Remove template class
    paper.closest('.preview-panel')?.classList.remove('template-modern', 'template-europass', 'template-minimal');
    return;
  }

  let html = '';

  // ---- Header ----
  if (name) html += `<h1 style="color: ${cvAccentColor};">${esc(name)}</h1>`;
  if (title) html += `<div class="cv-title">${esc(title)}</div>`;

  // ---- Contact Line ----
  const contacts = [];
  if (email) contacts.push(`<span class="cv-contact-item"><i class="fa-solid fa-envelope"></i> <a href="mailto:${esc(email)}">${esc(email)}</a></span>`);
  if (phone) contacts.push(`<span class="cv-contact-item"><i class="fa-solid fa-phone"></i> ${esc(phone)}</span>`);
  if (location) contacts.push(`<span class="cv-contact-item"><i class="fa-solid fa-location-dot"></i> ${esc(location)}</span>`);
  if (linkedin) contacts.push(`<span class="cv-contact-item"><i class="fa-brands fa-linkedin"></i> <a href="${esc(linkedin)}" target="_blank">LinkedIn</a></span>`);
  if (github) contacts.push(`<span class="cv-contact-item"><i class="fa-brands fa-github"></i> <a href="${esc(github)}" target="_blank">GitHub</a></span>`);
  if (website) contacts.push(`<span class="cv-contact-item"><i class="fa-solid fa-globe"></i> <a href="${esc(website)}" target="_blank">Website</a></span>`);
  if (contacts.length) html += `<div class="cv-contact-line">${contacts.join('')}</div>`;

  // ---- Visa Note ----
  if (visaNote) {
    html += `<div class="cv-visa-note" style="border-color: ${cvAccentColor};">${esc(visaNote)}</div>`;
  }

  // ---- Summary ----
  if (summary) {
    html += `<h2 style="color: ${cvAccentColor}; border-color: ${cvAccentColor};">Professional Summary</h2>`;
    html += `<p class="cv-summary">${esc(summary)}</p>`;
  }

  // ---- Skills ----
  const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
  if (skillList.length) {
    html += `<h2 style="color: ${cvAccentColor}; border-color: ${cvAccentColor};">Technical Skills</h2>`;
    html += `<div class="cv-skills-container">`;
    skillList.forEach(skill => {
      html += `<span class="cv-skill-tag">${esc(skill)}</span>`;
    });
    html += `</div>`;
  }

  // ---- Languages ----
  if (languages) {
    html += `<p class="cv-languages"><strong>Languages:</strong> ${esc(languages)}</p>`;
  }

  // ---- Experience ----
  const filledExp = cvExperienceEntries.filter(e => e.role || e.company);
  if (filledExp.length) {
    html += `<h2 style="color: ${cvAccentColor}; border-color: ${cvAccentColor};">Work Experience</h2>`;
    filledExp.forEach(exp => {
      html += `<div class="cv-exp-entry">`;
      html += `<div class="cv-exp-header">`;
      html += `<span class="cv-exp-role">${esc(exp.role)}</span>`;
      const dates = [exp.startDate, exp.endDate].filter(Boolean).join(' — ');
      if (dates) html += `<span class="cv-exp-dates">${esc(dates)}</span>`;
      html += `</div>`;
      const companyParts = [exp.company, exp.location].filter(Boolean).join(' · ');
      if (companyParts) html += `<div class="cv-exp-company">${esc(companyParts)}</div>`;
      if (exp.achievements) {
        const lines = exp.achievements.split('\n').filter(l => l.trim());
        html += `<ul class="cv-exp-achievements">`;
        lines.forEach(line => {
          const clean = line.replace(/^[•\-\*]\s*/, '').trim();
          if (clean) html += `<li>${esc(clean)}</li>`;
        });
        html += `</ul>`;
      }
      html += `</div>`;
    });
  }

  // ---- Education ----
  const filledEdu = cvEducationEntries.filter(e => e.degree || e.institution);
  if (filledEdu.length) {
    html += `<h2 style="color: ${cvAccentColor}; border-color: ${cvAccentColor};">Education</h2>`;
    filledEdu.forEach(edu => {
      html += `<div class="cv-edu-entry">`;
      html += `<div class="cv-edu-header">`;
      html += `<span class="cv-edu-degree">${esc(edu.degree)}</span>`;
      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(' — ');
      if (dates) html += `<span class="cv-edu-dates">${esc(dates)}</span>`;
      html += `</div>`;
      const instParts = [edu.institution, edu.location].filter(Boolean).join(' · ');
      if (instParts) html += `<div class="cv-edu-institution">${esc(instParts)}</div>`;
      if (edu.details) html += `<div class="cv-edu-details">${esc(edu.details)}</div>`;
      html += `</div>`;
    });
  }

  // ---- Certifications ----
  const certLines = certifications.split('\n').map(l => l.trim()).filter(Boolean);
  if (certLines.length) {
    html += `<h2 style="color: ${cvAccentColor}; border-color: ${cvAccentColor};">Certifications</h2>`;
    certLines.forEach(cert => {
      html += `<div class="cv-cert-item" style="color: ${cvAccentColor};">${esc(cert)}</div>`;
    });
  }

  // ---- Projects ----
  if (projects) {
    html += `<h2 style="color: ${cvAccentColor}; border-color: ${cvAccentColor};">Key Projects</h2>`;
    html += `<div class="cv-projects">${parseSimpleMarkdown(projects)}</div>`;
  }

  paper.innerHTML = html;

  // Apply template class
  const previewPanel = paper.closest('.preview-panel');
  if (previewPanel) {
    previewPanel.classList.remove('template-modern', 'template-europass', 'template-minimal');
    previewPanel.classList.add(`template-${cvTemplate}`);
  }
}

// ============================================================
// SIMPLE MARKDOWN PARSER (for projects)
// ============================================================
function parseSimpleMarkdown(text) {
  return text
    .split('\n\n')
    .map(para => {
      let p = esc(para.trim());
      // Bold
      p = p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Italic
      p = p.replace(/\*(.+?)\*/g, '<em>$1</em>');
      // Inline code
      p = p.replace(/`(.+?)`/g, '<code>$1</code>');
      // Line breaks within paragraph
      p = p.replace(/\n/g, '<br>');
      return `<p>${p}</p>`;
    })
    .join('');
}

// ============================================================
// SAVE / LOAD DRAFT
// ============================================================
function saveCVDraft() {
  const val = id => document.getElementById(id)?.value || '';

  const draft = {
    name: val('cvName'),
    title: val('cvTitle'),
    email: val('cvEmail'),
    phone: val('cvPhone'),
    linkedin: val('cvLinkedin'),
    github: val('cvGithub'),
    location: val('cvLocation'),
    website: val('cvWebsite'),
    visaNote: val('cvVisaNote'),
    summary: val('cvSummary'),
    skills: val('cvSkills'),
    languages: val('cvLanguages'),
    certifications: val('cvCertifications'),
    projects: val('cvProjects'),
    experience: cvExperienceEntries,
    education: cvEducationEntries,
    template: cvTemplate,
    accentColor: cvAccentColor
  };

  try {
    localStorage.setItem('globalpath_cv_draft', JSON.stringify(draft));
    flashButton('btnSaveDraft', 'Saved!');
  } catch (e) {
    alert('Failed to save draft. LocalStorage may be full.');
  }
}

function loadCVDraft() {
  try {
    const raw = localStorage.getItem('globalpath_cv_draft');
    if (!raw) {
      alert('No saved draft found.');
      return;
    }

    const draft = JSON.parse(raw);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };

    set('cvName', draft.name);
    set('cvTitle', draft.title);
    set('cvEmail', draft.email);
    set('cvPhone', draft.phone);
    set('cvLinkedin', draft.linkedin);
    set('cvGithub', draft.github);
    set('cvLocation', draft.location);
    set('cvWebsite', draft.website);
    set('cvVisaNote', draft.visaNote);
    set('cvSummary', draft.summary);
    set('cvSkills', draft.skills);
    set('cvLanguages', draft.languages);
    set('cvCertifications', draft.certifications);
    set('cvProjects', draft.projects);

    if (draft.experience) cvExperienceEntries = draft.experience;
    if (draft.education) cvEducationEntries = draft.education;
    if (draft.template) {
      cvTemplate = draft.template;
      document.querySelectorAll('.template-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.template === cvTemplate);
      });
    }
    if (draft.accentColor) {
      cvAccentColor = draft.accentColor;
      document.querySelectorAll('.color-dot').forEach(dot => {
        dot.classList.toggle('active', dot.dataset.color === cvAccentColor);
      });
    }

    // Update char counter
    const summaryEl = document.getElementById('cvSummary');
    const counterEl = document.getElementById('summaryCharCounter');
    if (summaryEl && counterEl) counterEl.textContent = `${summaryEl.value.length} / 600`;

    renderExperienceEntries();
    renderEducationEntries();
    onCVChange();
    flashButton('btnLoadDraft', 'Loaded!');
  } catch (e) {
    alert('Failed to load draft. Data may be corrupted.');
  }
}

// ============================================================
// FLASH BUTTON FEEDBACK
// ============================================================
function flashButton(btnId, text) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  const labelEl = btn.querySelector('.btn-label');
  const originalText = labelEl ? labelEl.textContent : '';
  if (labelEl) labelEl.textContent = text;
  btn.classList.add('flash-success');

  setTimeout(() => {
    if (labelEl) labelEl.textContent = originalText;
    btn.classList.remove('flash-success');
  }, 1500);
}

// ============================================================
// COPY MARKDOWN CV
// ============================================================
function copyMarkdownCV() {
  const val = id => (document.getElementById(id)?.value || '').trim();

  let md = '';

  // Header
  const name = val('cvName');
  const title = val('cvTitle');
  if (name) md += `# ${name}\n`;
  if (title) md += `**${title}**\n\n`;

  // Contact
  const contactParts = [];
  if (val('cvEmail')) contactParts.push(`📧 ${val('cvEmail')}`);
  if (val('cvPhone')) contactParts.push(`📱 ${val('cvPhone')}`);
  if (val('cvLocation')) contactParts.push(`📍 ${val('cvLocation')}`);
  if (val('cvLinkedin')) contactParts.push(`🔗 [LinkedIn](${val('cvLinkedin')})`);
  if (val('cvGithub')) contactParts.push(`💻 [GitHub](${val('cvGithub')})`);
  if (val('cvWebsite')) contactParts.push(`🌐 [Website](${val('cvWebsite')})`);
  if (contactParts.length) md += contactParts.join(' | ') + '\n\n';

  // Visa Note
  if (val('cvVisaNote')) md += `> ${val('cvVisaNote')}\n\n`;

  // Summary
  if (val('cvSummary')) md += `## Professional Summary\n\n${val('cvSummary')}\n\n`;

  // Skills
  const skillList = val('cvSkills').split(',').map(s => s.trim()).filter(Boolean);
  if (skillList.length) md += `## Technical Skills\n\n${skillList.join(' · ')}\n\n`;

  // Languages
  if (val('cvLanguages')) md += `**Languages:** ${val('cvLanguages')}\n\n`;

  // Experience
  const filledExp = cvExperienceEntries.filter(e => e.role || e.company);
  if (filledExp.length) {
    md += `## Work Experience\n\n`;
    filledExp.forEach(exp => {
      const dates = [exp.startDate, exp.endDate].filter(Boolean).join(' — ');
      md += `### ${exp.role || 'Untitled Role'}`;
      if (dates) md += ` *(${dates})*`;
      md += '\n';
      const companyParts = [exp.company, exp.location].filter(Boolean).join(' · ');
      if (companyParts) md += `*${companyParts}*\n\n`;
      if (exp.achievements) {
        exp.achievements.split('\n').filter(l => l.trim()).forEach(line => {
          const clean = line.replace(/^[•\-\*]\s*/, '').trim();
          if (clean) md += `- ${clean}\n`;
        });
        md += '\n';
      }
    });
  }

  // Education
  const filledEdu = cvEducationEntries.filter(e => e.degree || e.institution);
  if (filledEdu.length) {
    md += `## Education\n\n`;
    filledEdu.forEach(edu => {
      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(' — ');
      md += `### ${edu.degree || 'Untitled'}`;
      if (dates) md += ` *(${dates})*`;
      md += '\n';
      const instParts = [edu.institution, edu.location].filter(Boolean).join(' · ');
      if (instParts) md += `*${instParts}*\n`;
      if (edu.details) md += `${edu.details}\n`;
      md += '\n';
    });
  }

  // Certifications
  const certLines = val('cvCertifications').split('\n').filter(l => l.trim());
  if (certLines.length) {
    md += `## Certifications\n\n`;
    certLines.forEach(c => md += `- ${c.trim()}\n`);
    md += '\n';
  }

  // Projects
  if (val('cvProjects')) {
    md += `## Key Projects\n\n${val('cvProjects')}\n\n`;
  }

  // Copy to clipboard
  navigator.clipboard.writeText(md).then(() => {
    flashButton('btnCopyMarkdown', 'Copied!');
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = md;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    flashButton('btnCopyMarkdown', 'Copied!');
  });
}

// ============================================================
// PDF AUDIT (Heuristics)
// ============================================================
async function handlePDFUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.type !== 'application/pdf') {
    alert('Please upload a PDF file.');
    return;
  }

  const modal = document.getElementById('auditModal');
  const tipsEl = document.getElementById('auditTips');
  const fillEl = document.getElementById('auditFill');
  const percentEl = document.getElementById('auditPercentage');

  if (modal) modal.classList.add('active');
  if (percentEl) percentEl.textContent = '...';
  if (fillEl) fillEl.style.width = '0%';
  if (tipsEl) {
    tipsEl.innerHTML = `<div style="width: 100%; text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 20px;">
      <i class="fa-solid fa-spinner fa-spin"></i> Analyzing PDF document...
    </div>`;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    // Using pdfjsLib loaded via CDN in index.html
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      fullText += strings.join(' ') + '\n';
    }

    auditResumeText(fullText);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    if (tipsEl) {
      tipsEl.innerHTML = `<div style="width: 100%; text-align: center; color: var(--accent-rose); font-size: 0.9rem; padding: 20px;">
        <i class="fa-solid fa-triangle-exclamation"></i> Failed to parse PDF. Ensure it is a text-based PDF, not a scanned image.
      </div>`;
    }
  }

  // Reset input so same file can be uploaded again
  event.target.value = '';
}

function auditResumeText(text) {
  const checks = [];
  const lowerText = text.toLowerCase();

  // 1. Length Check
  const wordCount = text.split(/\s+/).length;
  checks.push({
    label: 'Length',
    pass: wordCount > 150 && wordCount < 1000,
    warn: wordCount <= 150,
    tip: wordCount > 150 && wordCount < 1000 ? `Good length (${wordCount} words)` : `Word count might be off (${wordCount})`
  });

  // 2. Email
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const hasEmail = emailRegex.test(text);
  checks.push({
    label: 'Email',
    pass: hasEmail,
    tip: hasEmail ? 'Email address found' : 'No email address found'
  });

  // 3. Phone (Basic regex)
  const phoneRegex = /(?:\+?\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/g;
  const hasPhone = phoneRegex.test(text);
  checks.push({
    label: 'Phone',
    pass: hasPhone,
    tip: hasPhone ? 'Phone number found' : 'No phone number found'
  });

  // 4. LinkedIn
  const hasLinkedIn = lowerText.includes('linkedin.com');
  checks.push({
    label: 'LinkedIn',
    pass: hasLinkedIn,
    tip: hasLinkedIn ? 'LinkedIn URL found' : 'No LinkedIn URL found'
  });

  // 5. Sections
  const hasExp = lowerText.includes('experience') || lowerText.includes('employment') || lowerText.includes('work history');
  const hasEdu = lowerText.includes('education') || lowerText.includes('academic') || lowerText.includes('university');
  const hasSkills = lowerText.includes('skills') || lowerText.includes('technologies');

  checks.push({
    label: 'Experience Section', pass: hasExp, tip: hasExp ? 'Experience section detected' : 'Missing Experience section'
  });
  checks.push({
    label: 'Education Section', pass: hasEdu, tip: hasEdu ? 'Education section detected' : 'Missing Education section'
  });
  checks.push({
    label: 'Skills Section', pass: hasSkills, tip: hasSkills ? 'Skills section detected' : 'Missing Skills section'
  });

  // 6. Action Verbs
  const actionVerbs = ['managed', 'developed', 'led', 'designed', 'created', 'implemented', 'improved', 'increased', 'reduced', 'coordinated', 'achieved', 'built'];
  let verbCount = 0;
  actionVerbs.forEach(v => {
    if (lowerText.includes(v)) verbCount++;
  });
  checks.push({
    label: 'Action Verbs',
    pass: verbCount >= 3,
    warn: verbCount > 0 && verbCount < 3,
    tip: verbCount >= 3 ? 'Strong use of action verbs' : 'Use more action verbs (e.g. Led, Developed)'
  });

  // Calculate Score
  const passed = checks.filter(c => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);

  // Update DOM
  const percentEl = document.getElementById('auditPercentage');
  const fillEl = document.getElementById('auditFill');
  const tipsEl = document.getElementById('auditTips');

  if (percentEl) percentEl.textContent = `${score}%`;
  if (fillEl) fillEl.style.width = `${score}%`;

  if (tipsEl) {
    tipsEl.innerHTML = checks.map(c => {
      const cls = c.pass ? 'pass' : (c.warn ? 'warn' : 'fail');
      const icon = c.pass ? 'fa-circle-check' : (c.warn ? 'fa-triangle-exclamation' : 'fa-circle-xmark');
      return `<span class="ats-tip ${cls}"><i class="fa-solid ${icon}"></i> ${c.tip}</span>`;
    }).join('');
  }
}

// ============================================================
// DOWNLOAD PDF
// ============================================================
function downloadPDF() {
  const paper = document.getElementById('cvPreviewPaper');
  if (!paper) return;

  const btn = document.getElementById('btnDownload');
  const originalBtnText = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span class="btn-label">Generating...</span>';
  btn.disabled = true;

  // Clone paper to avoid affecting the live preview
  const clone = paper.cloneNode(true);

  // Create an off-screen container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';

  // Preserve template class from parent
  const previewPanel = paper.closest('.preview-panel');
  if (previewPanel) {
    const classes = Array.from(previewPanel.classList).filter(c => c.startsWith('template-'));
    classes.forEach(c => container.classList.add(c));
  }

  // Remove interactive/visual effects from the clone
  clone.style.boxShadow = 'none';
  clone.style.transform = 'none';
  clone.style.transition = 'none';
  clone.style.margin = '0';
  clone.style.minHeight = 'auto';
  clone.style.height = 'auto';

  container.appendChild(clone);
  document.body.appendChild(container);

  const opt = {
    margin: 0,
    filename: 'Resume.pdf',
    image: { type: 'jpeg', quality: 1 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(clone).toPdf().get('pdf').then((pdf) => {
    pdf.setProperties({
      title: 'Resume',
      author: 'Sushmit Shekhar',
      creator: 'Sushmit Shekhar',
      subject: 'https://www.linkedin.com/in/sushmitshekhar/',
      keywords: 'resume, cv, Sushmit Shekhar'
    });
  }).save().then(() => {
    document.body.removeChild(container);
    btn.innerHTML = originalBtnText;
    btn.disabled = false;
    flashButton('btnDownload', 'Downloaded!');
  }).catch(err => {
    console.error(err);
    document.body.removeChild(container);
    btn.innerHTML = originalBtnText;
    btn.disabled = false;
    alert("Error generating PDF.");
  });
}
