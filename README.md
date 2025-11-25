# JobFinder - Student Job Search Platform

A modern, student-friendly job finder website that helps students find part-time and casual jobs requiring no experience.

![JobFinder Screenshot](screenshot.png)

## Features

### For Job Seekers
- 🔍 **Smart Search** - Search jobs by title, company, or keywords
- 📍 **Location Filtering** - Find jobs near you or remote opportunities
- 🎯 **Job Type Filters** - Part-time, Casual, Weekend jobs
- ⭐ **No Experience Required** - Filter for entry-level positions
- 💾 **Save Jobs** - Bookmark jobs for later (using localStorage)
- 📱 **Mobile Responsive** - Works great on all devices
- 🎓 **Student-Focused** - Highlights flexible hours, campus proximity, and remote options

### Job Features Highlighted
- Flexible hours
- Weekend availability
- Remote/work-from-home options
- Near campus locations
- Entry-level positions

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js with Express.js
- **Database**: SQLite with better-sqlite3
- **Styling**: Modern CSS with CSS Variables

## Getting Started

### Prerequisites
- Node.js 16+ installed
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/jobfinder.git
cd jobfinder
```

2. Install dependencies:
```bash
npm install
```

3. Seed the database with sample jobs:
```bash
npm run seed
```

4. Start the server:
```bash
npm start
```

5. Open your browser and visit:
```
http://localhost:3000
```

## Project Structure

```
jobfinder/
├── public/                 # Static frontend files
│   ├── css/
│   │   └── styles.css     # Main stylesheet
│   ├── js/
│   │   └── app.js         # Frontend JavaScript
│   ├── index.html         # Main landing page
│   └── saved.html         # Saved jobs page
├── scripts/
│   ├── database.js        # Database setup and connection
│   └── seed.js            # Sample data seeder
├── data/                  # Database storage (gitignored)
├── tests/                 # Test files
├── server.js              # Express server and API routes
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## API Endpoints

### GET /api/jobs
List all jobs with optional filtering.

**Query Parameters:**
- `search` - Search term for title, company, or description
- `location` - Filter by location
- `job_type` - Filter by job type (Part-time, Casual, Weekend)
- `no_experience` - Filter for no experience required (true/false)
- `flexible_hours` - Filter for flexible hours (true/false)
- `weekend_availability` - Filter for weekend jobs (true/false)
- `remote_option` - Filter for remote jobs (true/false)
- `near_campus` - Filter for jobs near campus (true/false)
- `sort_by` - Sort field (date_posted, title, company)
- `sort_order` - Sort order (asc, desc)
- `page` - Page number for pagination
- `limit` - Results per page

**Example:**
```
GET /api/jobs?no_experience=true&job_type=Part-time&limit=10
```

### GET /api/jobs/:id
Get details for a specific job.

**Example:**
```
GET /api/jobs/1
```

### POST /api/jobs/search
Advanced search with multiple filters.

**Request Body:**
```json
{
  "keywords": ["barista", "coffee"],
  "locations": ["Boston", "New York"],
  "job_types": ["Part-time", "Casual"],
  "no_experience": true,
  "features": ["flexible_hours", "remote_option"],
  "sort_by": "date_posted",
  "sort_order": "desc",
  "page": 1,
  "limit": 20
}
```

### GET /api/stats
Get job statistics.

**Response:**
```json
{
  "totalJobs": 20,
  "noExperienceJobs": 20,
  "remoteJobs": 6,
  "partTimeJobs": 11,
  "locations": ["Atlanta, GA", "Austin, TX", ...],
  "jobTypes": ["Casual", "Part-time", "Weekend"]
}
```

## Database Schema

```sql
CREATE TABLE jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL,
  experience_required INTEGER DEFAULT 0,
  description TEXT,
  requirements TEXT,
  pay_rate TEXT,
  application_url TEXT,
  date_posted TEXT,
  source TEXT,
  flexible_hours INTEGER DEFAULT 0,
  weekend_availability INTEGER DEFAULT 0,
  remote_option INTEGER DEFAULT 0,
  near_campus INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
)
```

## Sample Jobs

The seed script includes 20 sample jobs across various categories:
- Barista positions
- Retail sales associates
- Food delivery drivers
- Library assistants
- Online tutors
- Event staff
- Social media assistants
- Dog walkers
- Data entry clerks
- And more!

## Extending the Application

### Adding New Job Sources

To add a job aggregator/scraper, create a new file in `scripts/` that:
1. Fetches jobs from an external source
2. Normalizes the data to match the database schema
3. Inserts new jobs into the database

Example structure:
```javascript
const { getDatabase } = require('./database');

async function fetchJobsFromSource() {
  // Fetch jobs from API/RSS/website
  const jobs = await yourFetchLogic();
  
  const db = getDatabase();
  const insert = db.prepare(`INSERT INTO jobs (...) VALUES (...)`);
  
  jobs.forEach(job => insert.run(normalizeJob(job)));
  db.close();
}
```

### Adding Authentication

To add user authentication:
1. Install `express-session` and `bcrypt`
2. Create a users table
3. Add login/register endpoints
4. Protect saved jobs with user association

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for any purpose.
