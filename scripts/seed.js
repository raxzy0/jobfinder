const { initDatabase } = require('./database');

const sampleJobs = [
  {
    title: "Barista - Part Time",
    company: "Campus Coffee Co.",
    location: "Boston, MA",
    job_type: "Part-time",
    experience_required: 0,
    description: "Join our friendly team at Campus Coffee Co.! We're looking for enthusiastic individuals to serve coffee and create a welcoming atmosphere for students and faculty. No prior experience needed - we provide full training!",
    requirements: "Friendly personality, ability to work in a fast-paced environment, flexible schedule, must be able to work mornings or evenings",
    pay_rate: "$15-17/hour + tips",
    application_url: "https://example.com/apply/barista",
    source: "direct",
    flexible_hours: 1,
    weekend_availability: 1,
    remote_option: 0,
    near_campus: 1
  },
  {
    title: "Retail Sales Associate",
    company: "Campus Bookstore",
    location: "New York, NY",
    job_type: "Part-time",
    experience_required: 0,
    description: "Help fellow students find their textbooks and university merchandise! Perfect for students who love helping others. Flexible scheduling around your classes.",
    requirements: "Excellent customer service skills, ability to lift up to 30 lbs, basic math skills",
    pay_rate: "$16/hour",
    application_url: "https://example.com/apply/retail",
    source: "direct",
    flexible_hours: 1,
    weekend_availability: 1,
    remote_option: 0,
    near_campus: 1
  },
  {
    title: "Food Delivery Driver",
    company: "QuickBite Delivery",
    location: "Los Angeles, CA",
    job_type: "Casual",
    experience_required: 0,
    description: "Be your own boss! Deliver food to hungry customers in your area. Work whenever you want - perfect for students with unpredictable schedules. Use your own car or bike.",
    requirements: "Valid driver's license or bicycle, smartphone, reliable transportation, clean driving record",
    pay_rate: "$18-25/hour (including tips)",
    application_url: "https://example.com/apply/driver",
    source: "aggregator",
    flexible_hours: 1,
    weekend_availability: 1,
    remote_option: 0,
    near_campus: 0
  },
  {
    title: "Library Assistant",
    company: "City Public Library",
    location: "Chicago, IL",
    job_type: "Part-time",
    experience_required: 0,
    description: "Join our team helping patrons find resources, shelving books, and maintaining a quiet study environment. Great for students who enjoy reading and helping others!",
    requirements: "Organized, detail-oriented, comfortable with computers, ability to be on feet for extended periods",
    pay_rate: "$14/hour",
    application_url: "https://example.com/apply/library",
    source: "government",
    flexible_hours: 1,
    weekend_availability: 1,
    remote_option: 0,
    near_campus: 1
  },
  {
    title: "Online Tutor",
    company: "TutorMatch",
    location: "Remote",
    job_type: "Casual",
    experience_required: 0,
    description: "Help high school students with subjects you excel in! Set your own schedule and work from anywhere. Perfect for college students looking to share their knowledge.",
    requirements: "Strong academic background in at least one subject, reliable internet connection, good communication skills",
    pay_rate: "$20-35/hour",
    application_url: "https://example.com/apply/tutor",
    source: "online",
    flexible_hours: 1,
    weekend_availability: 1,
    remote_option: 1,
    near_campus: 0
  },
  {
    title: "Event Staff",
    company: "Campus Events Inc.",
    location: "Austin, TX",
    job_type: "Weekend",
    experience_required: 0,
    description: "Work at exciting events including concerts, sports games, and festivals! Perfect for students who want to earn money while experiencing amazing events.",
    requirements: "Must be 18+, ability to stand for long periods, team player, available on weekends",
    pay_rate: "$15-20/hour",
    application_url: "https://example.com/apply/events",
    source: "direct",
    flexible_hours: 0,
    weekend_availability: 1,
    remote_option: 0,
    near_campus: 0
  },
  {
    title: "Social Media Assistant",
    company: "StartUp Hub",
    location: "San Francisco, CA",
    job_type: "Part-time",
    experience_required: 0,
    description: "Help manage social media accounts for a growing startup! Create content, engage with followers, and learn digital marketing skills. Remote work available.",
    requirements: "Active on social media, creative, good writing skills, basic graphic design knowledge a plus",
    pay_rate: "$17/hour",
    application_url: "https://example.com/apply/social",
    source: "startup",
    flexible_hours: 1,
    weekend_availability: 0,
    remote_option: 1,
    near_campus: 0
  },
  {
    title: "Dog Walker",
    company: "Paws & Play Pet Services",
    location: "Seattle, WA",
    job_type: "Casual",
    experience_required: 0,
    description: "Love dogs? Get paid to walk them! Flexible hours, great exercise, and furry companionship. Perfect for students who want to stay active while earning money.",
    requirements: "Love for animals, reliable transportation, comfortable in all weather, available during daytime hours",
    pay_rate: "$18-22/hour",
    application_url: "https://example.com/apply/dogwalker",
    source: "local",
    flexible_hours: 1,
    weekend_availability: 1,
    remote_option: 0,
    near_campus: 0
  },
  {
    title: "Data Entry Clerk",
    company: "DataFlow Solutions",
    location: "Remote",
    job_type: "Part-time",
    experience_required: 0,
    description: "Work from home entering data into our systems. Perfect for detail-oriented students who want to work on their own schedule. Training provided.",
    requirements: "Fast typing skills (50+ WPM), attention to detail, reliable internet, basic computer skills",
    pay_rate: "$14-16/hour",
    application_url: "https://example.com/apply/data",
    source: "online",
    flexible_hours: 1,
    weekend_availability: 0,
    remote_option: 1,
    near_campus: 0
  },
  {
    title: "Campus Tour Guide",
    company: "State University",
    location: "Columbus, OH",
    job_type: "Part-time",
    experience_required: 0,
    description: "Share your love for your university with prospective students! Lead campus tours and help families learn about student life. Great for building public speaking skills.",
    requirements: "Current student in good standing, excellent communication skills, knowledge of campus, enthusiastic personality",
    pay_rate: "$13/hour",
    application_url: "https://example.com/apply/tour",
    source: "university",
    flexible_hours: 1,
    weekend_availability: 1,
    remote_option: 0,
    near_campus: 1
  },
  {
    title: "Restaurant Server",
    company: "The Student Grill",
    location: "Miami, FL",
    job_type: "Part-time",
    experience_required: 0,
    description: "Join our fun team at The Student Grill! We're a popular spot near campus looking for friendly servers. No experience needed - we'll teach you everything!",
    requirements: "Must be 18+, friendly personality, ability to multitask, available evenings and weekends",
    pay_rate: "$12/hour + tips (avg $18-25/hour total)",
    application_url: "https://example.com/apply/server",
    source: "restaurant",
    flexible_hours: 1,
    weekend_availability: 1,
    remote_option: 0,
    near_campus: 1
  },
  {
    title: "Customer Support Representative",
    company: "TechHelp Inc.",
    location: "Remote",
    job_type: "Part-time",
    experience_required: 0,
    description: "Help customers via chat and email from the comfort of your home! Full training provided. Perfect for students who are tech-savvy and enjoy problem-solving.",
    requirements: "Strong written communication, patience, basic tech knowledge, quiet workspace at home",
    pay_rate: "$15-18/hour",
    application_url: "https://example.com/apply/support",
    source: "tech",
    flexible_hours: 1,
    weekend_availability: 0,
    remote_option: 1,
    near_campus: 0
  },
  {
    title: "Fitness Center Attendant",
    company: "Campus Recreation Center",
    location: "Denver, CO",
    job_type: "Part-time",
    experience_required: 0,
    description: "Work at the campus gym! Check in members, maintain equipment, and help create a positive workout environment. Free gym membership included!",
    requirements: "Interest in fitness, customer service skills, ability to work early mornings or late evenings",
    pay_rate: "$13/hour + free membership",
    application_url: "https://example.com/apply/fitness",
    source: "university",
    flexible_hours: 1,
    weekend_availability: 1,
    remote_option: 0,
    near_campus: 1
  },
  {
    title: "Grocery Store Cashier",
    company: "Fresh Market",
    location: "Philadelphia, PA",
    job_type: "Part-time",
    experience_required: 0,
    description: "Join our team as a cashier! We offer flexible scheduling perfect for students. Learn customer service and money handling skills in a friendly environment.",
    requirements: "Basic math skills, friendly demeanor, ability to stand for long periods, available various shifts",
    pay_rate: "$14/hour",
    application_url: "https://example.com/apply/cashier",
    source: "retail",
    flexible_hours: 1,
    weekend_availability: 1,
    remote_option: 0,
    near_campus: 0
  },
  {
    title: "Research Assistant",
    company: "University Research Lab",
    location: "Boston, MA",
    job_type: "Part-time",
    experience_required: 0,
    description: "Assist professors with research projects! Great opportunity to gain academic experience and build relationships with faculty. No prior research experience required.",
    requirements: "Enrolled student, attention to detail, interest in research, reliable and organized",
    pay_rate: "$15/hour",
    application_url: "https://example.com/apply/research",
    source: "university",
    flexible_hours: 1,
    weekend_availability: 0,
    remote_option: 0,
    near_campus: 1
  },
  {
    title: "Movie Theater Staff",
    company: "Cineplex Entertainment",
    location: "Atlanta, GA",
    job_type: "Weekend",
    experience_required: 0,
    description: "Love movies? Work at our theater! Sell tickets, serve concessions, and enjoy free movies on your days off. Perfect weekend job for film enthusiasts.",
    requirements: "Must be 16+, customer service oriented, available Friday-Sunday, ability to handle cash",
    pay_rate: "$12/hour + free movies",
    application_url: "https://example.com/apply/theater",
    source: "entertainment",
    flexible_hours: 0,
    weekend_availability: 1,
    remote_option: 0,
    near_campus: 0
  },
  {
    title: "Freelance Content Writer",
    company: "ContentHub",
    location: "Remote",
    job_type: "Casual",
    experience_required: 0,
    description: "Write blog posts and articles on various topics! Choose projects that interest you and work on your own schedule. Great for building your portfolio.",
    requirements: "Strong writing skills, ability to meet deadlines, research skills, good grammar",
    pay_rate: "$0.05-0.15 per word",
    application_url: "https://example.com/apply/writer",
    source: "freelance",
    flexible_hours: 1,
    weekend_availability: 1,
    remote_option: 1,
    near_campus: 0
  },
  {
    title: "Babysitter",
    company: "CareConnect Families",
    location: "San Diego, CA",
    job_type: "Casual",
    experience_required: 0,
    description: "Help local families with childcare! Set your own rates and schedule. Platform connects you with families in your area. Background check required.",
    requirements: "Must be 18+, experience with children preferred, CPR certification a plus, reliable transportation",
    pay_rate: "$15-25/hour",
    application_url: "https://example.com/apply/babysit",
    source: "childcare",
    flexible_hours: 1,
    weekend_availability: 1,
    remote_option: 0,
    near_campus: 0
  },
  {
    title: "Parking Attendant",
    company: "Stadium Parking Services",
    location: "Houston, TX",
    job_type: "Weekend",
    experience_required: 0,
    description: "Work event days at the stadium! Direct traffic and assist with parking. Great pay for just a few hours of work on game days and concert nights.",
    requirements: "Must be 18+, ability to stand and walk for extended periods, available event days",
    pay_rate: "$18/hour",
    application_url: "https://example.com/apply/parking",
    source: "events",
    flexible_hours: 0,
    weekend_availability: 1,
    remote_option: 0,
    near_campus: 0
  },
  {
    title: "Virtual Assistant",
    company: "VA Connect",
    location: "Remote",
    job_type: "Part-time",
    experience_required: 0,
    description: "Help small business owners with administrative tasks! Manage emails, schedule appointments, and handle basic tasks. Work from anywhere with internet access.",
    requirements: "Organized, good communication, proficient with email and calendar apps, reliable internet",
    pay_rate: "$14-18/hour",
    application_url: "https://example.com/apply/va",
    source: "freelance",
    flexible_hours: 1,
    weekend_availability: 0,
    remote_option: 1,
    near_campus: 0
  }
];

function seedDatabase() {
  console.log('Initializing database...');
  const db = initDatabase();
  
  // Clear existing data
  db.exec('DELETE FROM jobs');
  
  // Insert sample jobs
  const insert = db.prepare(`
    INSERT INTO jobs (
      title, company, location, job_type, experience_required,
      description, requirements, pay_rate, application_url, source,
      flexible_hours, weekend_availability, remote_option, near_campus
    ) VALUES (
      @title, @company, @location, @job_type, @experience_required,
      @description, @requirements, @pay_rate, @application_url, @source,
      @flexible_hours, @weekend_availability, @remote_option, @near_campus
    )
  `);
  
  const insertMany = db.transaction((jobs) => {
    for (const job of jobs) {
      insert.run(job);
    }
  });
  
  insertMany(sampleJobs);
  
  console.log(`Seeded ${sampleJobs.length} jobs successfully!`);
  db.close();
}

seedDatabase();
