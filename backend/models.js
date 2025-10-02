const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));

// --- SCHEMA ---
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    title TEXT,
    level INTEGER,
    gaijinId TEXT,
    rank TEXT,
    favoriteVehicle TEXT,
    squadron TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS stats (
    user_id INTEGER,
    kdr REAL,
    win_rate REAL,
    total_battles INTEGER,
    total_kills INTEGER,
    total_assists INTEGER,
    total_damage INTEGER,
    total_sl INTEGER,
    total_rp INTEGER,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS discord_links (
    discord_id TEXT UNIQUE,
    user_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS battles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    battle_data TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// --- USER HELPERS ---
function getOrCreateUser(username, cb) {
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (row) return cb(null, row);
    db.run('INSERT INTO users (username) VALUES (?)', [username], function(err) {
      if (err) return cb(err);
      cb(null, { id: this.lastID, username });
    });
  });
}
function getUserById(id, cb) {
  db.get('SELECT * FROM users WHERE id = ?', [id], cb);
}
function getUserByUsername(username, cb) {
  db.get('SELECT * FROM users WHERE username = ?', [username], cb);
}
function updateUserProfile(id, profile, cb) {
  const fields = ['title','level','gaijinId','rank','favoriteVehicle','squadron'];
  const updates = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => profile[f]);
  values.push(id);
  db.run(`UPDATE users SET ${updates} WHERE id = ?`, values, cb);
}
function getAllUsers(cb) {
  db.all('SELECT * FROM users', [], cb);
}

// --- BATTLE HELPERS ---
function addBattle(user_id, battle_data, cb) {
  db.run('INSERT INTO battles (user_id, battle_data) VALUES (?, ?)', [user_id, JSON.stringify(battle_data)], cb);
}
function getBattlesForUser(user_id, cb) {
  db.all('SELECT * FROM battles WHERE user_id = ? ORDER BY timestamp ASC', [user_id], (err, rows) => {
    if (err) return cb(err);
    // Parse JSON
    rows.forEach(r => { r.battle_data = JSON.parse(r.battle_data); });
    cb(null, rows);
  });
}
function deleteBattle(battle_id, cb) {
  db.run('DELETE FROM battles WHERE id = ?', [battle_id], cb);
}

// --- ADMIN HELPERS ---

// Get system-wide statistics for admin dashboard
function getSystemStats(cb) {
  const stats = {};
  
  // Get total users
  db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
    if (err) return cb(err);
    stats.totalUsers = row.count;
    
    // Get total battles
    db.get('SELECT COUNT(*) as count FROM battles', [], (err, row) => {
      if (err) return cb(err);
      stats.totalBattles = row.count;
      
      // Get battles in last 24 hours
      db.get(`SELECT COUNT(*) as count FROM battles 
              WHERE timestamp > datetime('now', '-1 day')`, [], (err, row) => {
        if (err) return cb(err);
        stats.battlesLast24h = row.count;
        
        // Get battles in last 7 days
        db.get(`SELECT COUNT(*) as count FROM battles 
                WHERE timestamp > datetime('now', '-7 days')`, [], (err, row) => {
          if (err) return cb(err);
          stats.battlesLast7d = row.count;
          
          // Get most active users
          db.all(`SELECT u.username, COUNT(b.id) as battle_count 
                  FROM users u 
                  LEFT JOIN battles b ON u.id = b.user_id 
                  GROUP BY u.id, u.username 
                  ORDER BY battle_count DESC 
                  LIMIT 10`, [], (err, rows) => {
            if (err) return cb(err);
            stats.mostActiveUsers = rows;
            
            // Get recent battles
            db.all(`SELECT u.username, b.timestamp, 
                           JSON_EXTRACT(b.battle_data, '$.result') as result,
                           JSON_EXTRACT(b.battle_data, '$.missionName') as mission
                    FROM battles b 
                    JOIN users u ON b.user_id = u.id 
                    ORDER BY b.timestamp DESC 
                    LIMIT 20`, [], (err, rows) => {
              if (err) return cb(err);
              stats.recentBattles = rows;
              
              cb(null, stats);
            });
          });
        });
      });
    });
  });
}

// Get all users with their battle counts (for admin)
function getAllUsersWithStats(cb) {
  db.all(`SELECT u.*, COUNT(b.id) as battle_count,
                 MAX(b.timestamp) as last_battle
          FROM users u 
          LEFT JOIN battles b ON u.id = b.user_id 
          GROUP BY u.id, u.username, u.title, u.level, u.gaijinId, u.rank, u.favoriteVehicle, u.squadron
          ORDER BY battle_count DESC`, [], cb);
}

// Delete user and all associated data
function deleteUserCompletely(userId, cb) {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run('DELETE FROM battles WHERE user_id = ?', [userId]);
    db.run('DELETE FROM stats WHERE user_id = ?', [userId]);
    db.run('DELETE FROM discord_links WHERE user_id = ?', [userId]);
    db.run('DELETE FROM users WHERE id = ?', [userId]);
    db.run('COMMIT', cb);
  });
}

// Get user activity over time (for charts)
function getUserActivityOverTime(userId, days = 30, cb) {
  db.all(`SELECT DATE(timestamp) as date, COUNT(*) as battles
          FROM battles 
          WHERE user_id = ? AND timestamp > datetime('now', '-${days} days')
          GROUP BY DATE(timestamp)
          ORDER BY date ASC`, [userId], cb);
}

// Get system activity over time
function getSystemActivityOverTime(days = 30, cb) {
  db.all(`SELECT DATE(timestamp) as date, COUNT(*) as battles
          FROM battles 
          WHERE timestamp > datetime('now', '-${days} days')
          GROUP BY DATE(timestamp)
          ORDER BY date ASC`, [], cb);
}

// --- HELPERS ---

// Update stats for user
function updateStats(username, stats, cb) {
  getOrCreateUser(username, (err, user) => {
    if (err) return cb(err);
    db.run(`REPLACE INTO stats (user_id, kdr, win_rate, total_battles, total_kills, total_assists, total_damage, total_sl, total_rp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, stats.kdr, stats.win_rate, stats.total_battles, stats.total_kills, stats.total_assists, stats.total_damage, stats.total_sl, stats.total_rp],
      cb
    );
  });
}

// Get stats by username
function getStatsByUsername(username, cb) {
  db.get(`SELECT u.username, s.* FROM users u JOIN stats s ON u.id = s.user_id WHERE u.username = ?`, [username], cb);
}

// Get stats by Discord ID
function getStatsByDiscordId(discordId, cb) {
  db.get(`SELECT u.username, s.* FROM discord_links d JOIN users u ON d.user_id = u.id JOIN stats s ON u.id = s.user_id WHERE d.discord_id = ?`, [discordId], cb);
}

// Get leaderboard (top 10 by win_rate)
function getLeaderboard(cb) {
  db.all(`SELECT u.username, s.* FROM users u JOIN stats s ON u.id = s.user_id ORDER BY s.win_rate DESC LIMIT 10`, [], cb);
}

// Link Discord to user
function linkDiscord(discordId, username, cb) {
  getOrCreateUser(username, (err, user) => {
    if (err) return cb(err);
    db.run('REPLACE INTO discord_links (discord_id, user_id) VALUES (?, ?)', [discordId, user.id], cb);
  });
}

module.exports = {
  getOrCreateUser,
  getUserById,
  getUserByUsername,
  updateUserProfile,
  getAllUsers,
  addBattle,
  getBattlesForUser,
  deleteBattle,
  updateStats,
  getStatsByUsername,
  getStatsByDiscordId,
  getLeaderboard,
  linkDiscord,
  // Admin functions
  getSystemStats,
  getAllUsersWithStats,
  deleteUserCompletely,
  getUserActivityOverTime,
  getSystemActivityOverTime,
  db
};
