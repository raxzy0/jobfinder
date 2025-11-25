// JobFinder Application
class JobFinder {
  constructor() {
    this.jobs = [];
    this.savedJobs = this.loadSavedJobs();
    this.currentPage = 1;
    this.totalPages = 1;
    this.filters = {
      search: '',
      location: '',
      job_type: '',
      no_experience: false,
      flexible_hours: false,
      weekend_availability: false,
      remote_option: false,
      near_campus: false,
      sort_by: 'date_posted',
      sort_order: 'desc'
    };
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.loadStats();
    this.loadJobs();
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
        this.loadJobs();
      }, 300));
    }
    
    // Job type chips
    document.querySelectorAll('.job-type-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const type = chip.dataset.type;
        
        document.querySelectorAll('.job-type-chip').forEach(c => c.classList.remove('active'));
        
        if (this.filters.job_type === type) {
          this.filters.job_type = '';
        } else {
          chip.classList.add('active');
          this.filters.job_type = type;
        }
        
        this.currentPage = 1;
        this.loadJobs();
      });
    });
    
    // Toggle filters
    const toggleFilters = ['no_experience', 'flexible_hours', 'weekend_availability', 'remote_option', 'near_campus'];
    toggleFilters.forEach(filter => {
      const toggle = document.getElementById(`${filter}Toggle`);
      if (toggle) {
        toggle.addEventListener('change', () => {
          this.filters[filter] = toggle.checked;
          this.currentPage = 1;
          this.loadJobs();
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
        this.loadJobs();
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
      document.getElementById('noExpJobs').textContent = stats.noExperienceJobs;
      document.getElementById('remoteJobs').textContent = stats.remoteJobs;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }
  
  async loadJobs() {
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
      if (this.filters.job_type) params.append('job_type', this.filters.job_type);
      if (this.filters.no_experience) params.append('no_experience', 'true');
      if (this.filters.flexible_hours) params.append('flexible_hours', 'true');
      if (this.filters.weekend_availability) params.append('weekend_availability', 'true');
      if (this.filters.remote_option) params.append('remote_option', 'true');
      if (this.filters.near_campus) params.append('near_campus', 'true');
      
      const response = await fetch(`/api/jobs?${params}`);
      const data = await response.json();
      
      this.jobs = data.jobs;
      this.totalPages = data.pagination.totalPages;
      
      this.renderJobs();
      this.renderPagination();
      this.updateJobsCount(data.pagination.total);
    } catch (error) {
      console.error('Error loading jobs:', error);
      jobsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h3>Error loading jobs</h3>
          <p>Please try again later</p>
        </div>
      `;
    }
  }
  
  renderJobs() {
    const jobsList = document.getElementById('jobsList');
    if (!jobsList) return;
    
    if (this.jobs.length === 0) {
      jobsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3>No jobs found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      `;
      return;
    }
    
    jobsList.innerHTML = this.jobs.map(job => this.renderJobCard(job)).join('');
    
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
    const isSaved = this.savedJobs.includes(job.id);
    
    let badges = `<span class="badge badge-type">${job.job_type}</span>`;
    
    if (!job.experience_required) {
      badges += '<span class="badge badge-no-exp">No Experience</span>';
    }
    if (job.remote_option) {
      badges += '<span class="badge badge-remote">Remote</span>';
    }
    if (job.flexible_hours) {
      badges += '<span class="badge badge-flexible">Flexible Hours</span>';
    }
    if (job.near_campus) {
      badges += '<span class="badge badge-campus">Near Campus</span>';
    }
    if (job.weekend_availability) {
      badges += '<span class="badge badge-weekend">Weekends</span>';
    }
    
    return `
      <div class="job-card" data-id="${job.id}">
        <div class="job-card-header">
          <div>
            <h3 class="job-title">${this.escapeHtml(job.title)}</h3>
            <p class="job-company">${this.escapeHtml(job.company)}</p>
          </div>
          <button class="save-btn ${isSaved ? 'saved' : ''}" data-id="${job.id}" title="${isSaved ? 'Remove from saved' : 'Save job'}">
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
        </div>
        <div class="job-badges">${badges}</div>
        <p class="job-description">${this.escapeHtml(job.description || '')}</p>
        <div class="job-card-footer">
          <span class="job-pay">${this.escapeHtml(job.pay_rate || 'Competitive pay')}</span>
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
          this.loadJobs();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }
  
  updateJobsCount(total) {
    const countEl = document.getElementById('jobsCount');
    if (countEl) {
      countEl.innerHTML = `Showing <strong>${this.jobs.length}</strong> of <strong>${total}</strong> jobs`;
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
          <button class="save-btn-full ${isSaved ? 'saved' : ''}" id="modalSaveBtn" data-id="${job.id}" style="background: ${isSaved ? 'var(--accent-color)' : 'var(--background-color)'}; border: 1px solid ${isSaved ? 'var(--accent-color)' : 'var(--border-color)'}; color: ${isSaved ? 'white' : 'var(--text-primary)'}; padding: 0.875rem 1.25rem; border-radius: var(--radius-md); font-weight: 500;">
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
      location: '',
      job_type: '',
      no_experience: false,
      flexible_hours: false,
      weekend_availability: false,
      remote_option: false,
      near_campus: false,
      sort_by: 'date_posted',
      sort_order: 'desc'
    };
    
    // Reset UI
    document.getElementById('searchInput').value = '';
    document.getElementById('locationFilter').value = '';
    document.querySelectorAll('.job-type-chip').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    document.getElementById('sortSelect').value = 'date_posted-desc';
    
    this.currentPage = 1;
    this.loadJobs();
  }
  
  toggleSaveJob(jobId) {
    const index = this.savedJobs.indexOf(jobId);
    
    if (index > -1) {
      this.savedJobs.splice(index, 1);
      this.showToast('Job removed from saved');
    } else {
      this.savedJobs.push(jobId);
      this.showToast('Job saved!');
    }
    
    localStorage.setItem('savedJobs', JSON.stringify(this.savedJobs));
    this.updateSavedCount();
    this.renderJobs();
  }
  
  loadSavedJobs() {
    try {
      return JSON.parse(localStorage.getItem('savedJobs')) || [];
    } catch {
      return [];
    }
  }
  
  updateSavedCount() {
    const countEl = document.getElementById('savedCount');
    if (countEl) {
      countEl.textContent = this.savedJobs.length;
      countEl.style.display = this.savedJobs.length > 0 ? 'inline' : 'none';
    }
  }
  
  shareJob(job) {
    const shareUrl = `${window.location.origin}?job=${job.id}`;
    const shareText = `Check out this job: ${job.title} at ${job.company}`;
    
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
  window.jobFinder = new JobFinder();
  
  // Check for job ID in URL params
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('job');
  if (jobId) {
    setTimeout(() => {
      window.jobFinder.showJobDetails(jobId);
    }, 500);
  }
});
