require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const ProfessorProfile = require('./models/ProfessorProfile');
const Announcement = require('./models/Announcement');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/univconnect');
    console.log('Connected to MongoDB');

    // Clear existing
    await User.deleteMany({});
    await ProfessorProfile.deleteMany({});
    await Announcement.deleteMany({});
    console.log('Cleared existing data');

    // Create Dean
    const dean = await User.create({
      name: 'Dr. James Wilson',
      email: 'dean@univ.edu',
      password: 'dean123',
      role: 'dean',
      department: 'Administration',
      isActive: true
    });
    console.log('Created dean:', dean.email);

    // Create Professors
    const professorsData = [
      { name: 'Dr. Sarah Chen', email: 'prof@univ.edu', department: 'Computer Science', specialization: 'Machine Learning & AI', bio: 'Expert in deep learning and neural networks with 10+ years of research experience.', maxStudents: 50, minGroupSize: 3, maxGroupSize: 5, projectTypes: ['Major Project', 'Research', 'Minor Project'], officeHours: 'Mon/Wed 2-4 PM, Room 301' },
      { name: 'Prof. Rajesh Kumar', email: 'rkumar@univ.edu', department: 'Electronics', specialization: 'Embedded Systems & IoT', bio: 'Specializes in IoT and smart systems. Looking for innovative hardware-software integration projects.', maxStudents: 40, minGroupSize: 2, maxGroupSize: 4, projectTypes: ['Major Project', 'Minor Project'], officeHours: 'Tue/Thu 10-12 PM, Room 205' },
      { name: 'Dr. Priya Sharma', email: 'psharma@univ.edu', department: 'Computer Science', specialization: 'Web Technologies & Cloud', bio: 'Full-stack development expert with industry experience at top tech companies.', maxStudents: 60, minGroupSize: 3, maxGroupSize: 6, projectTypes: ['Major Project', 'Minor Project', 'Other'], officeHours: 'Mon/Fri 11 AM-1 PM, Room 402', acceptingStudents: false },
    ];

    for (const pd of professorsData) {
      const prof = await User.create({
        name: pd.name, email: pd.email, password: 'prof123',
        role: 'professor', department: pd.department, isActive: true
      });
      await ProfessorProfile.create({
        user: prof._id,
        maxStudents: pd.maxStudents,
        minGroupSize: pd.minGroupSize,
        maxGroupSize: pd.maxGroupSize,
        specialization: pd.specialization,
        bio: pd.bio,
        projectTypes: pd.projectTypes,
        officeHours: pd.officeHours,
        acceptingStudents: pd.acceptingStudents !== false,
        currentStudents: 0
      });
      console.log('Created professor:', prof.email);
    }

    // Create Students
    const studentsData = [
      { name: 'Arjun Patel', email: 'student@univ.edu', rollNumber: 'CS2021001', department: 'Computer Science' },
      { name: 'Priya Nair', email: 'priya@univ.edu', rollNumber: 'CS2021002', department: 'Computer Science' },
      { name: 'Rahul Singh', email: 'rahul@univ.edu', rollNumber: 'CS2021003', department: 'Computer Science' },
      { name: 'Sneha Gupta', email: 'sneha@univ.edu', rollNumber: 'CS2021004', department: 'Computer Science' },
      { name: 'Vikram Mehta', email: 'vikram@univ.edu', rollNumber: 'EC2021001', department: 'Electronics' },
    ];

    for (const sd of studentsData) {
      await User.create({ ...sd, password: 'student123', role: 'student', isActive: true });
      console.log('Created student:', sd.email);
    }

    // Create sample announcements
    const deanId = dean._id;
    await Announcement.create([
      {
        title: 'Project Registration Deadline',
        content: 'All student groups must register their projects by the end of this month. Please ensure your group is enrolled under a professor before the deadline.',
        author: deanId,
        targetAudience: 'students',
        priority: 'high',
        pinned: true
      },
      {
        title: 'Welcome to UnivConnect!',
        content: 'Welcome to the new university project collaboration platform. Students can form groups, enroll under professors, and communicate seamlessly. Professors can manage their groups and guide students effectively.',
        author: deanId,
        targetAudience: 'all',
        priority: 'medium',
        pinned: false
      },
      {
        title: 'Faculty Meeting - Project Reviews',
        content: 'All professors are requested to attend the mid-semester project review meeting on the 15th. Please prepare progress reports for your enrolled groups.',
        author: deanId,
        targetAudience: 'professors',
        priority: 'medium',
        pinned: false
      }
    ]);
    console.log('Created announcements');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDemo Credentials:');
    console.log('Dean:      dean@univ.edu / dean123');
    console.log('Professor: prof@univ.edu / prof123');
    console.log('Student:   student@univ.edu / student123');
    console.log('\nAdditional accounts:');
    console.log('Professor: rkumar@univ.edu / prof123');
    console.log('Professor: psharma@univ.edu / prof123 (not accepting)');
    console.log('Students:  priya/rahul/sneha/vikram @univ.edu / student123');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
