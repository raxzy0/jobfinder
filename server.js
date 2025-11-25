const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDatabase, initDatabase } = require('./scripts/database');

const app = express();
const PORT = process.env.PORT || 3000;

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
app.get('/api/jobs', (req, res) => {
  try {
    const db = getDatabase();
    
    const {
      search,
      location,
      job_type,
      no_experience,
      flexible_hours,
      weekend_availability,
      remote_option,
      near_campus,
      sort_by = 'date_posted',
      sort_order = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    let query = 'SELECT * FROM jobs WHERE 1=1';
    const params = [];
    
    // Search filter (title, company, description)
    if (search) {
      query += ' AND (title LIKE ? OR company LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
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
    
    // Weekend availability filter
    if (weekend_availability === 'true' || weekend_availability === '1') {
      query += ' AND weekend_availability = 1';
    }
    
    // Remote option filter
    if (remote_option === 'true' || remote_option === '1') {
      query += ' AND remote_option = 1';
    }
    
    // Near campus filter
    if (near_campus === 'true' || near_campus === '1') {
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
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM jobs WHERE 1=1';
    const countParams = [];
    
    if (search) {
      countQuery += ' AND (title LIKE ? OR company LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
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
    if (weekend_availability === 'true' || weekend_availability === '1') {
      countQuery += ' AND weekend_availability = 1';
    }
    if (remote_option === 'true' || remote_option === '1') {
      countQuery += ' AND remote_option = 1';
    }
    if (near_campus === 'true' || near_campus === '1') {
      countQuery += ' AND near_campus = 1';
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
app.get('/api/jobs/:id', (req, res) => {
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
app.post('/api/jobs/search', (req, res) => {
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
app.get('/api/stats', (req, res) => {
  try {
    const db = getDatabase();
    
    const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
    const noExperienceJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE experience_required = 0').get().count;
    const remoteJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE remote_option = 1').get().count;
    const partTimeJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE job_type = 'Part-time'").get().count;
    
    const locations = db.prepare('SELECT DISTINCT location FROM jobs ORDER BY location').all();
    const jobTypes = db.prepare('SELECT DISTINCT job_type FROM jobs ORDER BY job_type').all();
    
    db.close();
    
    res.json({
      totalJobs,
      noExperienceJobs,
      remoteJobs,
      partTimeJobs,
      locations: locations.map(l => l.location),
      jobTypes: jobTypes.map(j => j.job_type)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Serve the main HTML file for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`JobFinder server running on http://localhost:${PORT}`);
});

module.exports = app;
