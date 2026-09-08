const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '12h' });
}
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
    const user = await db.get('SELECT * FROM users WHERE username = $1', [username]);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Invalid username or password.' });
    res.json({ token: signToken(user), user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } catch (e) { next(e); }
});
router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password are required.' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    const user = await db.get('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) return res.status(401).json({ error: 'Current password is incorrect.' });
    await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [await bcrypt.hash(newPassword, 10), req.user.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});
router.post('/users', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { username, password, name, role } = req.body;
    if (!username || !password || !name) return res.status(400).json({ error: 'Username, password and name are required.' });
    if (await db.get('SELECT id FROM users WHERE username=$1', [username])) return res.status(409).json({ error: 'That username is already taken.' });
    const finalRole = role || 'editor';
    const hash = await bcrypt.hash(password, 10);
    const row = await db.get('INSERT INTO users (username,password_hash,name,role) VALUES ($1,$2,$3,$4) RETURNING id,username,name,role', [username, hash, name, finalRole]);
    res.status(201).json(row);
  } catch (e) { next(e); }
});
router.get('/users', authenticate, requireRole('admin'), async (req, res, next) => {
  try { res.json(await db.all('SELECT id,username,name,role,created_at FROM users ORDER BY id')); } catch (e) { next(e); }
});
router.delete('/users/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    if (Number(req.params.id) === Number(req.user.id)) return res.status(400).json({ error: 'You cannot delete your own account while logged in.' });
    await db.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});
module.exports = router;
