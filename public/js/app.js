// CS Internship Finder Application
class InternshipFinder {
  constructor() {
    this.internships = [];
    this.savedInternships = this.loadSavedInternships();
    this.currentPage = 1;
    this.totalPages = 1;
    this.filters = {
      search: '',
      location: 'Sydney',
      student_level: '',
      skills: '',
      no_experience: false,
      flexible_hours: false,
      remote_option: false,
      sort_by: 'date_posted',
      sort_order: 'desc'
    };
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.loadStats();
    this.loadInternships();
    this.updateSavedCount();
  }
  
  bindEvents() {
    // Search form
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.handleSearch());
    }
    
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleSearch();
      });
    }
    
    // Location filter
    const locationInput = document.getElementById('locationFilter');
    if (locationInput) {
      locationInput.addEventListener('input', this.debounce(() => {
        this.filters.location = locationInput.value;
        this.currentPage = 1;
        this.loadInternships();
      }, 300));
    }
    
    // Skills filter
    const skillsInput = document.getElementById('skillsFilter');
    if (skillsInput) {
      skillsInput.addEventListener('input', this.debounce(() => {
        this.filters.skills = skillsInput.value;
        this.currentPage = 1;
        this.loadInternships();
      }, 300));
    }
    
    // Student level chips
    document.querySelectorAll('.student-level-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const level = chip.dataset.level;
        
        document.querySelectorAll('.student-level-chip').forEach(c => c.classList.remove('active'));
        
        if (this.filters.student_level === level) {
          this.filters.student_level = '';
        } else {
          chip.classList.add('active');
          this.filters.student_level = level;
        }
        
        this.currentPage = 1;
        this.loadInternships();
      });
    });
    
    // Toggle filters
    const toggleFilters = ['no_experience', 'flexible_hours', 'remote_option'];
    toggleFilters.forEach(filter => {
      const toggle = document.getElementById(`${filter}Toggle`);
      if (toggle) {
        toggle.addEventListener('change', () => {
          this.filters[filter] = toggle.checked;
          this.currentPage = 1;
          this.loadInternships();
        });
      }
    });
    
    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        const [sort_by, sort_order] = sortSelect.value.split('-');
        this.filters.sort_by = sort_by;
        this.filters.sort_order = sort_order;
        this.loadInternships();
      });
    }
    
    // Clear filters
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => this.clearFilters());
    }
    
    // Modal close
    const modalOverlay = document.getElementById('jobModal');
    const modalClose = document.getElementById('modalClose');
    
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) this.closeModal();
      });
    }
    
    if (modalClose) {
      modalClose.addEventListener('click', () => this.closeModal());
    }
    
    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
  }
  
  async loadStats() {
    try {
      const response = await fetch('/api/stats');
      const stats = await response.json();
      
      document.getElementById('totalJobs').textContent = stats.totalJobs;
      document.getElementById('firstYearJobs').textContent = stats.firstYearJobs;
      document.getElementById('penultimateJobs').textContent = stats.penultimateJobs + stats.finalYearJobs;
      document.getElementById('remoteJobs').textContent = stats.remoteJobs;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }
  
  async loadInternships() {
    const jobsList = document.getElementById('jobsList');
    if (!jobsList) return;
    
    jobsList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
      const params = new URLSearchParams({
        page: this.currentPage,
        limit: 10,
        sort_by: this.filters.sort_by,
        sort_order: this.filters.sort_order
      });
      
      if (this.filters.search) params.append('search', this.filters.search);
      if (this.filters.location) params.append('location', this.filters.location);
      if (this.filters.student_level) params.append('student_level', this.filters.student_level);
      if (this.filters.skills) params.append('skills', this.filters.skills);
      if (this.filters.no_experience) params.append('no_experience', 'true');
      if (this.filters.flexible_hours) params.append('flexible_hours', 'true');
      if (this.filters.remote_option) params.append('remote_option', 'true');
      
      const response = await fetch(`/api/jobs?${params}`);
      const data = await response.json();
      
      this.internships = data.jobs;
      this.totalPages = data.pagination.totalPages;
      
      this.renderInternships();
      this.renderPagination();
      this.updateInternshipsCount(data.pagination.total);
    } catch (error) {
      console.error('Error loading internships:', error);
      jobsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h3>Error loading internships</h3>
          <p>Please try again later</p>
        </div>
      `;
    }
  }
  
  renderInternships() {
    const jobsList = document.getElementById('jobsList');
    if (!jobsList) return;
    
    if (this.internships.length === 0) {
      jobsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3>No internships found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      `;
      return;
    }
    
    jobsList.innerHTML = this.internships.map(job => this.renderJobCard(job)).join('');
    
    // Bind card click events
    jobsList.querySelectorAll('.job-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.save-btn') && !e.target.closest('.apply-btn')) {
          const jobId = card.dataset.id;
          this.showJobDetails(jobId);
        }
      });
    });
    
    // Bind save button events
    jobsList.querySelectorAll('.save-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const jobId = parseInt(btn.dataset.id);
        this.toggleSaveJob(jobId);
      });
    });
    
    // Bind apply button events
    jobsList.querySelectorAll('.apply-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });
  }
  
  renderJobCard(job) {
    const isSaved = this.savedInternships.includes(job.id);
    
    // Student level badge
    const studentLevelMap = {
      'first_year': 'First Year',
      'penultimate': 'Penultimate',
      'final_year': 'Final Year',
      'any': 'All Levels'
    };
    
    let badges = `<span class="badge badge-level">${studentLevelMap[job.student_level] || 'All Levels'}</span>`;
    
    if (!job.experience_required) {
      badges += '<span class="badge badge-no-exp">Entry Level</span>';
    }
    if (job.remote_option) {
      badges += '<span class="badge badge-remote">Remote</span>';
    }
    if (job.flexible_hours) {
      badges += '<span class="badge badge-flexible">Flexible</span>';
    }
    
    // Skills badges (show first 3)
    if (job.skills) {
      const skillsArray = job.skills.split(',').slice(0, 3);
      skillsArray.forEach(skill => {
        badges += `<span class="badge badge-skill">${this.escapeHtml(skill.trim())}</span>`;
      });
    }
    
    // Deadline info
    let deadlineHtml = '';
    if (job.application_deadline) {
      const deadline = new Date(job.application_deadline);
      const today = new Date();
      const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntil > 0 && daysUntil <= 30) {
        deadlineHtml = `
          <span class="job-meta-item deadline-urgent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Due in ${daysUntil} days
          </span>
        `;
      } else if (daysUntil > 30) {
        deadlineHtml = `
          <span class="job-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ${deadline.toLocaleDateString()}
          </span>
        `;
      }
    }
    
    return `
      <div class="job-card" data-id="${job.id}">
        <div class="job-card-header">
          <div>
            <h3 class="job-title">${this.escapeHtml(job.title)}</h3>
            <p class="job-company">${this.escapeHtml(job.company)}</p>
          </div>
          <button class="save-btn ${isSaved ? 'saved' : ''}" data-id="${job.id}" title="${isSaved ? 'Remove from saved' : 'Save internship'}">
            ${isSaved ? '★' : '☆'}
          </button>
        </div>
        <div class="job-meta">
          <span class="job-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            ${this.escapeHtml(job.location)}
          </span>
          <span class="job-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            ${job.date_posted || 'Recent'}
          </span>
          ${deadlineHtml}
        </div>
        <div class="job-badges">${badges}</div>
        <p class="job-description">${this.escapeHtml(job.description || '').substring(0, 150)}...</p>
        <div class="job-card-footer">
          <span class="job-pay">${this.escapeHtml(job.pay_rate || 'Competitive salary')}</span>
          <a href="${job.application_url || '#'}" target="_blank" rel="noopener noreferrer" class="apply-btn">Apply Now</a>
        </div>
      </div>
    `;
  }
  
  renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination || this.totalPages <= 1) {
      if (pagination) pagination.innerHTML = '';
      return;
    }
    
    let html = `
      <button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">←</button>
    `;
    
    for (let i = 1; i <= this.totalPages; i++) {
      if (i === 1 || i === this.totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
        html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
      } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
        html += '<span style="padding: 0 0.5rem;">...</span>';
      }
    }
    
    html += `
      <button class="page-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">→</button>
    `;
    
    pagination.innerHTML = html;
    
    pagination.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page >= 1 && page <= this.totalPages) {
          this.currentPage = page;
          this.loadInternships();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }
  
  updateInternshipsCount(total) {
    const countEl = document.getElementById('jobsCount');
    if (countEl) {
      countEl.innerHTML = `Showing <strong>${this.internships.length}</strong> of <strong>${total}</strong> internships`;
    }
  }
  
  async showJobDetails(jobId) {
    const modal = document.getElementById('jobModal');
    const modalBody = document.getElementById('modalBody');
    
    if (!modal || !modalBody) return;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    modalBody.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      const job = await response.json();
      
      const isSaved = this.savedJobs.includes(job.id);
      
      let badges = `<span class="badge badge-type">${job.job_type}</span>`;
      if (!job.experience_required) {
        badges += '<span class="badge badge-no-exp">No Experience Required</span>';
      }
      if (job.remote_option) {
        badges += '<span class="badge badge-remote">Remote Available</span>';
      }
      if (job.flexible_hours) {
        badges += '<span class="badge badge-flexible">Flexible Hours</span>';
      }
      if (job.near_campus) {
        badges += '<span class="badge badge-campus">Near Campus</span>';
      }
      if (job.weekend_availability) {
        badges += '<span class="badge badge-weekend">Weekend Availability</span>';
      }
      
      modalBody.innerHTML = `
        <div class="modal-header">
          <h2 class="job-title">${this.escapeHtml(job.title)}</h2>
          <p class="job-company">${this.escapeHtml(job.company)}</p>
          <div class="job-meta" style="margin-top: 0.75rem;">
            <span class="job-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              ${this.escapeHtml(job.location)}
            </span>
            <span class="job-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ${this.escapeHtml(job.pay_rate || 'Competitive pay')}
            </span>
          </div>
          <div class="job-badges" style="margin-top: 1rem;">${badges}</div>
          <button class="modal-close" id="modalClose">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h3>Description</h3>
            <p>${this.escapeHtml(job.description || 'No description available.')}</p>
          </div>
          ${job.requirements ? `
            <div class="detail-section">
              <h3>Requirements</h3>
              <ul>
                ${job.requirements.split(',').map(req => `<li>${this.escapeHtml(req.trim())}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          <div class="detail-section">
            <h3>Company Information</h3>
            <p><strong>${this.escapeHtml(job.company)}</strong></p>
            <p>Location: ${this.escapeHtml(job.location)}</p>
          </div>
        </div>
        <div class="modal-actions">
          <a href="${job.application_url || '#'}" target="_blank" rel="noopener noreferrer" class="apply-btn">Apply Now</a>
          <button class="share-btn" id="shareJobBtn">Share Job</button>
          <button class="save-btn-full ${isSaved ? 'saved' : ''}" id="modalSaveBtn" data-id="${job.id}">
            ${isSaved ? '★ Saved' : '☆ Save Job'}
          </button>
        </div>
      `;
      
      // Bind modal events
      document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
      document.getElementById('shareJobBtn').addEventListener('click', () => this.shareJob(job));
      document.getElementById('modalSaveBtn').addEventListener('click', () => {
        this.toggleSaveJob(job.id);
        this.showJobDetails(job.id);
      });
    } catch (error) {
      console.error('Error loading job details:', error);
      modalBody.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h3>Error loading job details</h3>
          <p>Please try again later</p>
        </div>
      `;
    }
  }
  
  closeModal() {
    const modal = document.getElementById('jobModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
  
  handleSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      this.filters.search = searchInput.value;
      this.currentPage = 1;
      this.loadJobs();
    }
  }
  
  clearFilters() {
    this.filters = {
      search: '',
      location: 'Sydney',
      student_level: '',
      skills: '',
      no_experience: false,
      flexible_hours: false,
      remote_option: false,
      sort_by: 'date_posted',
      sort_order: 'desc'
    };
    
    // Reset UI
    document.getElementById('searchInput').value = '';
    document.getElementById('locationFilter').value = 'Sydney';
    document.getElementById('skillsFilter').value = '';
    document.querySelectorAll('.student-level-chip').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    document.getElementById('sortSelect').value = 'date_posted-desc';
    
    this.currentPage = 1;
    this.loadInternships();
  }
  
  toggleSaveJob(jobId) {
    const index = this.savedInternships.indexOf(jobId);
    
    if (index > -1) {
      this.savedInternships.splice(index, 1);
      this.showToast('Internship removed from saved');
    } else {
      this.savedInternships.push(jobId);
      this.showToast('Internship saved!');
    }
    
    localStorage.setItem('savedInternships', JSON.stringify(this.savedInternships));
    this.updateSavedCount();
    this.renderInternships();
  }
  
  loadSavedInternships() {
    try {
      // Also check for old savedJobs key for backwards compatibility
      const saved = localStorage.getItem('savedInternships') || localStorage.getItem('savedJobs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
  
  updateSavedCount() {
    const countEl = document.getElementById('savedCount');
    if (countEl) {
      countEl.textContent = this.savedInternships.length;
      countEl.style.display = this.savedInternships.length > 0 ? 'inline' : 'none';
    }
  }
  
  shareJob(job) {
    const shareUrl = `${window.location.origin}?job=${job.id}`;
    const shareText = `Check out this internship: ${job.title} at ${job.company}`;
    
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: shareText,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.showToast('Link copied to clipboard!');
      }).catch(() => {
        this.showToast('Could not copy link');
      });
    }
  }
  
  showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
  
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.internshipFinder = new InternshipFinder();
  
  // Check for job ID in URL params
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('job');
  if (jobId) {
    setTimeout(() => {
      window.internshipFinder.showJobDetails(jobId);
    }, 500);
  }
});
