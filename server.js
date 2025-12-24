const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { getDatabase, initDatabase } = require('./scripts/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database on startup
try {
  initDatabase();
  console.log('Database initialized successfully');
} catch (error) {
  console.error('Database initialization error:', error.message);
}

// API Routes

// GET /api/jobs - List all jobs with filtering
app.get('/api/jobs', apiLimiter, (req, res) => {
  try {
    const db = getDatabase();
    
    const {
      search,
      location,
      job_type,
      no_experience,
      flexible_hours,
      remote_option,
      student_level,
      skills,
      sort_by = 'date_posted',
      sort_order = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    let query = 'SELECT * FROM jobs WHERE 1=1';
    const params = [];
    
    // Search filter (title, company, description, skills)
    if (search) {
      query += ' AND (title LIKE ? OR company LIKE ? OR description LIKE ? OR skills LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Location filter
    if (location) {
      query += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }
    
    // Job type filter
    if (job_type) {
      query += ' AND job_type = ?';
      params.push(job_type);
    }
    
    // No experience filter
    if (no_experience === 'true' || no_experience === '1') {
      query += ' AND experience_required = 0';
    }
    
    // Flexible hours filter
    if (flexible_hours === 'true' || flexible_hours === '1') {
      query += ' AND flexible_hours = 1';
    }
    
    // Remote option filter
    if (remote_option === 'true' || remote_option === '1') {
      query += ' AND remote_option = 1';
    }
    
    // Student level filter
    if (student_level) {
      query += ' AND (student_level = ? OR student_level = ?)';
      params.push(student_level, 'any');
    }
    
    // Skills filter
    if (skills) {
      query += ' AND skills LIKE ?';
      params.push(`%${skills}%`);
    }
    
    // Sorting
    const validSortFields = ['date_posted', 'title', 'company', 'created_at', 'application_deadline'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'date_posted';
    const order = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${order}`;
    
    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const jobs = db.prepare(query).all(...params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM jobs WHERE 1=1';
    const countParams = [];
    
    if (search) {
      countQuery += ' AND (title LIKE ? OR company LIKE ? OR description LIKE ? OR skills LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (location) {
      countQuery += ' AND location LIKE ?';
      countParams.push(`%${location}%`);
    }
    if (job_type) {
      countQuery += ' AND job_type = ?';
      countParams.push(job_type);
    }
    if (no_experience === 'true' || no_experience === '1') {
      countQuery += ' AND experience_required = 0';
    }
    if (flexible_hours === 'true' || flexible_hours === '1') {
      countQuery += ' AND flexible_hours = 1';
    }
    if (remote_option === 'true' || remote_option === '1') {
      countQuery += ' AND remote_option = 1';
    }
    if (student_level) {
      countQuery += ' AND (student_level = ? OR student_level = ?)';
      countParams.push(student_level, 'any');
    }
    if (skills) {
      countQuery += ' AND skills LIKE ?';
      countParams.push(`%${skills}%`);
    }
    
    const { total } = db.prepare(countQuery).get(...countParams);
    
    db.close();
    
    res.json({
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/:id - Get specific job details
app.get('/api/jobs/:id', apiLimiter, (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
    db.close();
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// POST /api/jobs/search - Advanced search
app.post('/api/jobs/search', apiLimiter, (req, res) => {
  try {
    const db = getDatabase();
    
    const {
      keywords = [],
      locations = [],
      job_types = [],
      no_experience = false,
      features = [],
      sort_by = 'date_posted',
      sort_order = 'desc',
      page = 1,
      limit = 20
    } = req.body;
    
    let query = 'SELECT * FROM jobs WHERE 1=1';
    const params = [];
    
    // Keywords search
    if (keywords.length > 0) {
      const keywordConditions = keywords.map(() => 
        '(title LIKE ? OR company LIKE ? OR description LIKE ?)'
      ).join(' OR ');
      query += ` AND (${keywordConditions})`;
      keywords.forEach(keyword => {
        const term = `%${keyword}%`;
        params.push(term, term, term);
      });
    }
    
    // Multiple locations
    if (locations.length > 0) {
      const locationConditions = locations.map(() => 'location LIKE ?').join(' OR ');
      query += ` AND (${locationConditions})`;
      locations.forEach(loc => params.push(`%${loc}%`));
    }
    
    // Multiple job types
    if (job_types.length > 0) {
      const placeholders = job_types.map(() => '?').join(', ');
      query += ` AND job_type IN (${placeholders})`;
      params.push(...job_types);
    }
    
    // No experience required
    if (no_experience) {
      query += ' AND experience_required = 0';
    }
    
    // Features
    if (features.includes('flexible_hours')) {
      query += ' AND flexible_hours = 1';
    }
    if (features.includes('weekend_availability')) {
      query += ' AND weekend_availability = 1';
    }
    if (features.includes('remote_option')) {
      query += ' AND remote_option = 1';
    }
    if (features.includes('near_campus')) {
      query += ' AND near_campus = 1';
    }
    
    // Sorting
    const validSortFields = ['date_posted', 'title', 'company', 'created_at'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'date_posted';
    const order = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${order}`;
    
    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const jobs = db.prepare(query).all(...params);
    db.close();
    
    res.json({
      jobs,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error searching jobs:', error);
    res.status(500).json({ error: 'Failed to search jobs' });
  }
});

// GET /api/stats - Get job statistics
app.get('/api/stats', apiLimiter, (req, res) => {
  try {
    const db = getDatabase();
    
    const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
    const noExperienceJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE experience_required = 0').get().count;
    const remoteJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE remote_option = 1').get().count;
    const firstYearJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE student_level = 'first_year' OR student_level = 'any'").get().count;
    const penultimateJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE student_level = 'penultimate' OR student_level = 'any'").get().count;
    const finalYearJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE student_level = 'final_year' OR student_level = 'any'").get().count;
    
    const locations = db.prepare('SELECT DISTINCT location FROM jobs ORDER BY location').all();
    const companies = db.prepare('SELECT DISTINCT company FROM jobs ORDER BY company').all();
    
    db.close();
    
    res.json({
      totalJobs,
      noExperienceJobs,
      remoteJobs,
      firstYearJobs,
      penultimateJobs,
      finalYearJobs,
      locations: locations.map(l => l.location),
      companies: companies.map(c => c.company)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/internships - List internships with student level filtering (alias for /api/jobs)
app.get('/api/internships', apiLimiter, (req, res) => {
  try {
    const db = getDatabase();
    
    const {
      student_level,
      skills,
      search,
      location = 'Sydney',  // Default to Sydney
      remote_option,
      sort_by = 'date_posted',
      sort_order = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    let query = 'SELECT * FROM jobs WHERE 1=1';
    const params = [];
    
    // Student level filter (primary filter for this endpoint)
    if (student_level) {
      query += ' AND (student_level = ? OR student_level = ?)';
      params.push(student_level, 'any');
    }
    
    // Search filter
    if (search) {
      query += ' AND (title LIKE ? OR company LIKE ? OR description LIKE ? OR skills LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Location filter (default to Sydney)
    if (location) {
      query += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }
    
    // Skills filter
    if (skills) {
      query += ' AND skills LIKE ?';
      params.push(`%${skills}%`);
    }
    
    // Remote option filter
    if (remote_option === 'true' || remote_option === '1') {
      query += ' AND remote_option = 1';
    }
    
    // Sorting
    const validSortFields = ['date_posted', 'title', 'company', 'application_deadline'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'date_posted';
    const order = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${order}`;
    
    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const internships = db.prepare(query).all(...params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM jobs WHERE 1=1';
    const countParams = [];
    
    if (student_level) {
      countQuery += ' AND (student_level = ? OR student_level = ?)';
      countParams.push(student_level, 'any');
    }
    if (search) {
      countQuery += ' AND (title LIKE ? OR company LIKE ? OR description LIKE ? OR skills LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (location) {
      countQuery += ' AND location LIKE ?';
      countParams.push(`%${location}%`);
    }
    if (skills) {
      countQuery += ' AND skills LIKE ?';
      countParams.push(`%${skills}%`);
    }
    if (remote_option === 'true' || remote_option === '1') {
      countQuery += ' AND remote_option = 1';
    }
    
    const { total } = db.prepare(countQuery).get(...countParams);
    
    db.close();
    
    res.json({
      internships,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ error: 'Failed to fetch internships' });
  }
});

// POST /api/scrape - Trigger scraping (simple version, no auth for now)
app.post('/api/scrape', apiLimiter, async (req, res) => {
  try {
    const InternshipScraper = require('./scripts/scraper');
    const scraper = new InternshipScraper();
    
    console.log('Manual scraping triggered via API');
    const result = await scraper.scrape();
    
    res.json({
      success: true,
      message: 'Scraping completed',
      jobsScraped: result.jobsScraped,
      errors: result.errors
    });
  } catch (error) {
    console.error('Error running scraper:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to run scraper',
      message: error.message
    });
  }
});

// Serve the main HTML file for all non-API routes
app.get('*', apiLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`JobFinder server running on http://localhost:${PORT}`);
});

module.exports = app;
