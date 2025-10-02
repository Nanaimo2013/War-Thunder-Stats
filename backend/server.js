require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

const models = require('./models');
const { calculateStats } = require('./statsCalculator');
const battleParser = require('./utils/battleParser');

const app = express();

// Security middleware
app.use(helmet());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Allow text files and JSON files
    if (file.mimetype === 'text/plain' || file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only text and JSON files are allowed'), false);
    }
  }
});

// Middleware to validate request body
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid token.' });
  }
};

// --- ADMIN AUTHENTICATION ROUTES ---
app.post('/api/admin/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], validateRequest, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(
        { username: username, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
      
      res.json({
        success: true,
        token,
        admin: { username }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin dashboard stats
app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const stats = await new Promise((resolve, reject) => {
      models.getSystemStats((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- USER CRUD ---
app.get('/api/users', (req, res) => {
  models.getAllUsers((err, users) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error.' });
    res.json({ success: true, users });
  });
});
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ success: false, message: 'Username required.' });
  models.getOrCreateUser(username, (err, user) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error.' });
    res.json({ success: true, user });
  });
});
app.get('/api/users/:id', (req, res) => {
  models.getUserById(req.params.id, (err, user) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error.' });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  });
});
app.put('/api/users/:id', (req, res) => {
  // Update username only
  const { username } = req.body;
  if (!username) return res.status(400).json({ success: false, message: 'Username required.' });
  models.db.run('UPDATE users SET username = ? WHERE id = ?', [username, req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'DB error.' });
    res.json({ success: true });
  });
});
app.delete('/api/users/:id', (req, res) => {
  models.db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'DB error.' });
    res.json({ success: true });
  });
});

// --- PROFILE EDIT ---
app.put('/api/users/:id/profile', (req, res) => {
  models.updateUserProfile(req.params.id, req.body, (err) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error.' });
    res.json({ success: true });
  });
});

// --- BATTLE CRUD ---
app.get('/api/users/:id/battles', (req, res) => {
  models.getBattlesForUser(req.params.id, (err, battles) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error.' });
    res.json({ success: true, battles });
  });
});
app.post('/api/users/:id/battles', (req, res) => {
  const battle = req.body;
  models.addBattle(req.params.id, battle, (err) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error.' });
    res.json({ success: true });
  });
});
app.delete('/api/users/:id/battles/:battleId', (req, res) => {
  models.deleteBattle(req.params.battleId, (err) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error.' });
    res.json({ success: true });
  });
});

// --- STATS CALCULATION (PLACEHOLDER) ---
function placeholderStats(battles) {
  // TODO: Port statsCalculator.js logic here
  return {
    totalBattles: battles.length,
    totalKillsAircraft: 0,
    totalKillsGround: 0,
    totalAssists: 0,
    totalSevereDamage: 0,
    totalCriticalDamage: 0,
    totalDamage: 0,
    totalAwardsSL: 0,
    totalAwardsRP: 0,
    totalActivityTimeSL: 0,
    totalActivityTimeRP: 0,
    totalTimePlayedRP: 0,
    totalRewardSL: 0,
    totalSkillBonusRP: 0,
    totalEarnedSL: 0,
    totalEarnedCRP: 0,
    totalActivity: 0,
    totalAutoRepairCost: 0,
    totalAutoAmmoCrewCost: 0,
    totalResearchedRP: 0,
    totalResearchingProgressRP: 0,
    overallTotalSL: 0,
    overallTotalCRP: 0,
    overallTotalRP: 0,
    wins: 0,
    defeats: 0,
    vehiclesUsed: {},
    topVehiclesKills: [],
    topVehiclesDamage: [],
    topAwards: {},
    averageActivity: 0,
    averageEarnedSL: 0,
    averageEarnedCRP: 0,
    averageTotalRP: 0,
    missionTypes: {},
    results: { Victory: 0, Defeat: 0, Unknown: 0 },
    missionNames: {}
  };
}

// --- USER STATS ENDPOINT ---
app.get('/api/users/:id/stats', (req, res) => {
  models.getBattlesForUser(req.params.id, (err, battles) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error.' });
    const stats = calculateStats(battles);
    res.json({ success: true, stats });
  });
});

// --- PLAYER COMPARISON ---
app.post('/api/compare', (req, res) => {
  const { usernames } = req.body;
  if (!Array.isArray(usernames)) return res.status(400).json({ success: false, message: 'usernames[] required.' });
  let results = [];
  let done = 0;
  usernames.forEach(username => {
    models.getUserByUsername(username, (err, user) => {
      if (err || !user) {
        results.push({ username, error: true });
        if (++done === usernames.length) res.json({ success: true, results });
        return;
      }
      models.getBattlesForUser(user.id, (err, battles) => {
        if (err) results.push({ username, error: true });
        else results.push({ username, stats: calculateStats(battles) });
        if (++done === usernames.length) res.json({ success: true, results });
      });
    });
  });
});

// --- ROUTES ---

// Upload log file (simulate parsing a JSON log for now)
app.post('/api/upload-log', upload.single('file'), (req, res) => {
  const username = req.body.username || req.query.username;
  if (!username || !req.file) return res.status(400).json({ success: false, message: 'Username and file required.' });
  // Simulate parsing: expect uploaded file to be JSON with stats fields
  fs.readFile(req.file.path, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ success: false, message: 'Failed to read file.' });
    let stats;
    try { stats = JSON.parse(data); } catch (e) { return res.status(400).json({ success: false, message: 'Invalid log format.' }); }
    models.updateStats(username, stats, (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Failed to update stats.' });
      res.json({ success: true, message: 'Stats updated.' });
    });
  });
});

// Get stats for a user
app.get('/api/stats/:username', (req, res) => {
  models.getUserByUsername(req.params.username, (err, user) => {
    if (err || !user) return res.status(404).json({ success: false, message: 'User not found.' });
    models.getBattlesForUser(user.id, (err, battles) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error.' });
      const stats = calculateStats(battles);
      res.json({ success: true, stats });
    });
  });
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  models.getLeaderboard((err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error.' });
    res.json({ success: true, leaderboard: rows });
  });
});

// Link Discord user to War Thunder username
app.post('/api/link-discord', (req, res) => {
  const { discordId, username } = req.body;
  if (!discordId || !username) return res.status(400).json({ success: false, message: 'discordId and username required.' });
  models.linkDiscord(discordId, username, (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Failed to link Discord.' });
    res.json({ success: true, message: 'Discord linked.' });
  });
});

// Get stats by Discord user ID
app.get('/api/discord/:discordId', (req, res) => {
  models.getStatsByDiscordId(req.params.discordId, (err, row) => {
    if (err || !row) return res.status(404).json({ success: false, message: 'User not found.' });
    models.getBattlesForUser(row.user_id, (err, battles) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error.' });
      const stats = calculateStats(battles);
      res.json({ success: true, stats });
    });
  });
});

// --- START SERVER ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`War Thunder Stats API running on http://localhost:${PORT}`);
}); 