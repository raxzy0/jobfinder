const axios = require('axios');
const cheerio = require('cheerio');
const { getDatabase } = require('./database');

/**
 * Scraper for CS internships in Sydney/NSW
 * Respects robots.txt and implements rate limiting
 */

class InternshipScraper {
  constructor() {
    this.db = null;
    this.requestDelay = 2000; // 2 seconds between requests
    this.scrapedJobs = [];
    this.errors = [];
  }

  /**
   * Main scraping function
   */
  async scrape() {
    console.log('Starting internship scraping...');
    this.db = getDatabase();
    
    try {
      // Scrape from different sources
      await this.scrapeGradConnection();
      await this.delay();
      
      await this.scrapeSeek();
      await this.delay();
      
      await this.scrapeIndeed();
      
      // Save results to database
      this.saveToDatabase();
      
      console.log(`\nScraping complete!`);
      console.log(`Successfully scraped: ${this.scrapedJobs.length} jobs`);
      console.log(`Errors encountered: ${this.errors.length}`);
      
      if (this.errors.length > 0) {
        console.log('\nErrors:');
        this.errors.forEach(err => console.log(`- ${err}`));
      }
      
    } catch (error) {
      console.error('Scraping failed:', error.message);
      this.errors.push(`General error: ${error.message}`);
    } finally {
      if (this.db) {
        this.db.close();
      }
    }
    
    return {
      success: true,
      jobsScraped: this.scrapedJobs.length,
      errors: this.errors
    };
  }

  /**
   * Delay between requests to respect rate limits
   */
  async delay() {
    return new Promise(resolve => setTimeout(resolve, this.requestDelay));
  }

  /**
   * Scrape from GradConnection
   */
  async scrapeGradConnection() {
    console.log('\nScraping GradConnection...');
    
    try {
      // Note: This is a simplified example. Real scraping would need:
      // 1. Check robots.txt first
      // 2. Handle pagination
      // 3. Handle dynamic content (may need puppeteer/playwright)
      
      const searchUrl = 'https://au.gradconnection.com/employers/search/?keywords=software+intern&location=Sydney';
      
      console.log('  Checking robots.txt...');
      const robotsUrl = 'https://au.gradconnection.com/robots.txt';
      
      try {
        const robotsResponse = await axios.get(robotsUrl, {
          timeout: 5000,
          headers: {
            'User-Agent': 'CS-Internship-Finder-Bot/1.0 (Educational Project)'
          }
        });
        
        // Basic robots.txt check (in production, use a proper robots.txt parser)
        if (robotsResponse.data.includes('Disallow: /employers/search')) {
          console.log('  ⚠️  Scraping not allowed by robots.txt');
          this.errors.push('GradConnection: Scraping disallowed by robots.txt');
          return;
        }
      } catch (error) {
        console.log('  ⚠️  Could not fetch robots.txt, proceeding with caution');
      }
      
      // In a real implementation, we would make the request here
      // For now, we'll add example data to demonstrate the structure
      console.log('  ℹ️  Note: Live scraping not implemented - using example structure');
      console.log('  ℹ️  In production, this would fetch and parse actual job listings');
      
      // Example of what scraped data would look like:
      const exampleJob = {
        title: "Software Engineering Intern",
        company: "Tech Company",
        location: "Sydney, NSW",
        job_type: "Internship",
        experience_required: 0,
        description: "Exciting internship opportunity...",
        requirements: "Computer Science student, Programming skills",
        pay_rate: "$30/hour",
        application_url: "https://example.com/apply",
        source: "gradconnection",
        flexible_hours: 0,
        remote_option: 0,
        student_level: this.determineStudentLevel("second year or penultimate"),
        skills: "Python, JavaScript, Git",
        degree_requirements: "Computer Science, Software Engineering",
        application_deadline: null
      };
      
      // this.scrapedJobs.push(exampleJob);
      console.log('  ✓ GradConnection scraping structure ready');
      
    } catch (error) {
      console.error('  ✗ Error scraping GradConnection:', error.message);
      this.errors.push(`GradConnection: ${error.message}`);
    }
  }

  /**
   * Scrape from Seek
   */
  async scrapeSeek() {
    console.log('\nScraping Seek...');
    
    try {
      console.log('  Checking robots.txt...');
      const robotsUrl = 'https://www.seek.com.au/robots.txt';
      
      try {
        const robotsResponse = await axios.get(robotsUrl, {
          timeout: 5000,
          headers: {
            'User-Agent': 'CS-Internship-Finder-Bot/1.0 (Educational Project)'
          }
        });
        
        console.log('  ✓ Robots.txt fetched successfully');
      } catch (error) {
        console.log('  ⚠️  Could not fetch robots.txt');
      }
      
      console.log('  ℹ️  Note: Live scraping not implemented - using example structure');
      console.log('  ℹ️  In production, this would fetch and parse actual job listings');
      console.log('  ✓ Seek scraping structure ready');
      
    } catch (error) {
      console.error('  ✗ Error scraping Seek:', error.message);
      this.errors.push(`Seek: ${error.message}`);
    }
  }

  /**
   * Scrape from Indeed Australia
   */
  async scrapeIndeed() {
    console.log('\nScraping Indeed Australia...');
    
    try {
      console.log('  Checking robots.txt...');
      const robotsUrl = 'https://au.indeed.com/robots.txt';
      
      try {
        const robotsResponse = await axios.get(robotsUrl, {
          timeout: 5000,
          headers: {
            'User-Agent': 'CS-Internship-Finder-Bot/1.0 (Educational Project)'
          }
        });
        
        console.log('  ✓ Robots.txt fetched successfully');
      } catch (error) {
        console.log('  ⚠️  Could not fetch robots.txt');
      }
      
      console.log('  ℹ️  Note: Live scraping not implemented - using example structure');
      console.log('  ℹ️  In production, this would fetch and parse actual job listings');
      console.log('  ✓ Indeed scraping structure ready');
      
    } catch (error) {
      console.error('  ✗ Error scraping Indeed:', error.message);
      this.errors.push(`Indeed: ${error.message}`);
    }
  }

  /**
   * Determine student level from job description
   * Uses keywords to categorize internships
   */
  determineStudentLevel(text) {
    const lowerText = text.toLowerCase();
    
    // Keywords for different levels
    const firstYearKeywords = ['first year', '1st year', 'freshman', 'vacation program', 'summer vacation'];
    const penultimateKeywords = ['penultimate', 'second-to-last year', 'industrial placement', '12 month'];
    const finalYearKeywords = ['final year', 'graduating', 'graduate program', 'honours', 'honors'];
    
    // Check for specific levels
    if (firstYearKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'first_year';
    }
    
    if (penultimateKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'penultimate';
    }
    
    if (finalYearKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'final_year';
    }
    
    // Default to 'any' if can't determine
    return 'any';
  }

  /**
   * Extract skills from job description
   */
  extractSkills(text) {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'TypeScript',
      'React', 'Node.js', 'Angular', 'Vue',
      'SQL', 'MongoDB', 'PostgreSQL',
      'Git', 'Docker', 'Kubernetes',
      'AWS', 'Azure', 'GCP',
      'Machine Learning', 'AI', 'Data Science',
      'HTML', 'CSS', 'REST API'
    ];
    
    const foundSkills = commonSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
    
    return foundSkills.join(', ') || null;
  }

  /**
   * Save scraped jobs to database
   */
  saveToDatabase() {
    if (this.scrapedJobs.length === 0) {
      console.log('\nNo jobs to save to database');
      return;
    }
    
    console.log(`\nSaving ${this.scrapedJobs.length} jobs to database...`);
    
    const insert = this.db.prepare(`
      INSERT INTO jobs (
        title, company, location, job_type, experience_required,
        description, requirements, pay_rate, application_url, source,
        flexible_hours, remote_option, student_level, skills, 
        degree_requirements, application_deadline
      ) VALUES (
        @title, @company, @location, @job_type, @experience_required,
        @description, @requirements, @pay_rate, @application_url, @source,
        @flexible_hours, @remote_option, @student_level, @skills,
        @degree_requirements, @application_deadline
      )
    `);
    
    const insertMany = this.db.transaction((jobs) => {
      for (const job of jobs) {
        try {
          insert.run(job);
        } catch (error) {
          console.error(`  ✗ Error inserting job: ${job.title}`, error.message);
          this.errors.push(`Database insert failed for: ${job.title}`);
        }
      }
    });
    
    insertMany(this.scrapedJobs);
    console.log('  ✓ Jobs saved to database');
  }

  /**
   * Normalize job data to match database schema
   */
  normalizeJob(rawJob) {
    return {
      title: rawJob.title || 'Unknown',
      company: rawJob.company || 'Unknown',
      location: rawJob.location || 'Sydney, NSW',
      job_type: 'Internship',
      experience_required: rawJob.experience_required || 0,
      description: rawJob.description || '',
      requirements: rawJob.requirements || '',
      pay_rate: rawJob.pay_rate || null,
      application_url: rawJob.application_url || '',
      source: rawJob.source || 'scraped',
      flexible_hours: rawJob.flexible_hours || 0,
      remote_option: rawJob.remote_option || 0,
      student_level: this.determineStudentLevel(
        `${rawJob.title} ${rawJob.description} ${rawJob.requirements}`
      ),
      skills: this.extractSkills(
        `${rawJob.title} ${rawJob.description} ${rawJob.requirements}`
      ),
      degree_requirements: rawJob.degree_requirements || 'Computer Science, Software Engineering, IT',
      application_deadline: rawJob.application_deadline || null
    };
  }
}

// Export the scraper class
module.exports = InternshipScraper;

// If run directly, execute the scraper
if (require.main === module) {
  const scraper = new InternshipScraper();
  scraper.scrape().then(result => {
    console.log('\nScraping session completed');
    process.exit(result.errors.length > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
