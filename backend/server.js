const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;
const SECRET_KEY = 'your-secret-key'; // Replace with secure key in production

const prisma = new PrismaClient();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Log static file serving
console.log('Serving static files from:', path.join(__dirname, 'public'));

// Root route
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'index.html');
  console.log('Attempting to serve:', filePath);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    console.error('File not found:', filePath);
    res.status(404).send('File not found: index.html');
  }
});

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    if (err.code === 'P2002') {
      res.status(400).json({ message: 'Username already exists' });
    } else {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token required' });
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Create post
app.post('/api/posts', authenticateToken, async (req, res) => {
  try {
    const { title, description, price, location } = req.body;
    const user = await prisma.user.findUnique({ where: { username: req.user.username } });
    const post = await prisma.post.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        location,
        userId: user.id,
      },
    });
    res.json({ message: 'Post created', post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true } } },
    });
    res.json(posts.map(post => ({
      id: post.id,
      title: post.title,
      description: post.description,
      price: post.price,
      location: post.location,
      username: post.user.username,
      createdAt: post.createdAt,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.user.username },
      include: { posts: { orderBy: { createdAt: 'desc' } } },
    });
    res.json({
      username: user.username,
      posts: user.posts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));