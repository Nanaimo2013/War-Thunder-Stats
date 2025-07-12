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
  db
}; 