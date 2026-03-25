const mongoose = require('mongoose');
const Course = require('../models/Course');
const User = require('../models/User');
require('dotenv').config();

const courses = [
  {
    title: "Python Programming",
    description: "Learn Python programming from basics to advanced concepts. Master data structures, algorithms, and real-world applications.",
    instructor: null, // Will be set to EduX Academy user
    instructorName: "EduX Academy",
    thumbnail: "https://img.youtube.com/vi/H2EJuAcrZYU/maxresdefault.jpg",
    category: "Programming",
    level: "Beginner",
    pointsRequired: 0,
    lessons: [{
      title: "Python Full Course",
      videoId: "H2EJuAcrZYU",
      duration: 14400 // 4 hours in seconds
    }],
    totalDuration: 14400,
    isPublished: true,
    tags: ["python", "programming", "beginner", "coding"]
  },
  {
    title: "Machine Learning",
    description: "Comprehensive introduction to machine learning algorithms, data preprocessing, and model evaluation techniques.",
    instructor: null,
    instructorName: "EduX Academy", 
    thumbnail: "https://img.youtube.com/vi/i_LwzRVP7bg/maxresdefault.jpg",
    category: "Data Science",
    level: "Intermediate",
    pointsRequired: 100,
    lessons: [{
      title: "Machine Learning Full Course",
      videoId: "i_LwzRVP7bg",
      duration: 18000 // 5 hours in seconds
    }],
    totalDuration: 18000,
    isPublished: true,
    tags: ["machine learning", "ai", "data science", "algorithms"]
  },
  {
    title: "Deep Learning",
    description: "Advanced deep learning concepts including neural networks, CNNs, RNNs, and modern architectures.",
    instructor: null,
    instructorName: "EduX Academy",
    thumbnail: "https://img.youtube.com/vi/VyWAvY2CF9c/maxresdefault.jpg", 
    category: "Data Science",
    level: "Advanced",
    pointsRequired: 200,
    lessons: [{
      title: "Deep Learning Full Course",
      videoId: "VyWAvY2CF9c",
      duration: 21600 // 6 hours in seconds
    }],
    totalDuration: 21600,
    isPublished: true,
    tags: ["deep learning", "neural networks", "ai", "tensorflow"]
  },
  {
    title: "HTML & CSS",
    description: "Master web development fundamentals with HTML5 and CSS3. Build responsive and modern websites.",
    instructor: null,
    instructorName: "EduX Academy",
    thumbnail: "https://img.youtube.com/vi/HGTJBPNC-Gw/maxresdefault.jpg",
    category: "Web Development", 
    level: "Beginner",
    pointsRequired: 0,
    lessons: [{
      title: "HTML & CSS Full Course",
      videoId: "HGTJBPNC-Gw",
      duration: 10800 // 3 hours in seconds
    }],
    totalDuration: 10800,
    isPublished: true,
    tags: ["html", "css", "web development", "frontend"]
  },
  {
    title: "MongoDB",
    description: "Learn MongoDB database fundamentals, CRUD operations, indexing, and advanced querying techniques.",
    instructor: null,
    instructorName: "EduX Academy",
    thumbnail: "https://img.youtube.com/vi/c2M-rlkkT5o/maxresdefault.jpg",
    category: "Database",
    level: "Intermediate", 
    pointsRequired: 50,
    lessons: [{
      title: "MongoDB Full Course",
      videoId: "c2M-rlkkT5o",
      duration: 12600 // 3.5 hours in seconds
    }],
    totalDuration: 12600,
    isPublished: true,
    tags: ["mongodb", "database", "nosql", "backend"]
  },
  {
    title: "MERN Stack Development",
    description: "Learn full stack web development using MongoDB, Express, React, and Node.js.",
    instructor: null,
    instructorName: "FreeCodeCamp",
    thumbnail: "https://img.youtube.com/vi/7CqJlxBYj-M/maxresdefault.jpg",
    category: "Web Development",
    level: "Advanced",
    pointsRequired: 150,
    lessons: [{
      title: "MERN Stack Full Course", 
      videoId: "7CqJlxBYj-M",
      duration: 43200 // 12 hours in seconds
    }],
    totalDuration: 43200,
    isPublished: true,
    tags: ["mern", "react", "nodejs", "mongodb", "express", "fullstack"]
  }
];

async function seedCourses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find or create EduX Academy user
    let eduxUser = await User.findOne({ email: 'academy@edux.com' });
    if (!eduxUser) {
      eduxUser = new User({
        name: 'EduX Academy',
        username: 'edux_academy',
        email: 'academy@edux.com',
        password: 'hashedpassword', // This should be properly hashed
        role: 'EDUCATOR',
        isOnboarded: true,
        avatar: 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=EA'
      });
      await eduxUser.save();
      console.log('Created EduX Academy user');
    }

    // Clear existing courses
    await Course.deleteMany({});
    console.log('Cleared existing courses');

    // Set instructor for all courses
    const coursesToInsert = courses.map(course => ({
      ...course,
      instructor: eduxUser._id
    }));

    // Insert courses
    const insertedCourses = await Course.insertMany(coursesToInsert);
    console.log(`Inserted ${insertedCourses.length} courses`);

    console.log('Course seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding courses:', error);
    process.exit(1);
  }
}

seedCourses();