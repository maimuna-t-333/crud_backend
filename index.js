const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
  origin: "*", 
  credentials: true
}));

app.use(express.json());


app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', port: PORT });
});


const validateUser = (req, res, next) => {
  const { name, email, age } = req.body;
  const errors = [];
  
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Valid email address is required');
  }
  
  if (age && (isNaN(age) || age < 0 || age > 150)) {
    errors.push('Age must be a reasonable number between 0 and 150');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
};


const validateId = (req, res, next) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  next();
};

// CREATE - Add new user
app.post('/users', validateUser, async (req, res) => {
  try {
    const { name, email, age } = req.body;
    const [result] = await db.execute(
      'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
      [name.trim(), email.trim(), age || null]
    );
    res.json({ message: 'User added successfully', id: result.insertId });
  } catch (err) {
    console.error('Create user error:', err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// READ - Get all users
app.get('/users', async (req, res) => {
  try {
    const [users] = await db.execute('SELECT * FROM users ORDER BY id ASC');
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// UPDATE - Update user by ID
app.put('/users/:id', validateId, validateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, age } = req.body;
    
    const [result] = await db.execute(
      'UPDATE users SET name=?, email=?, age=? WHERE id=?',
      [name.trim(), email.trim(), age || null, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Update user error:', err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE - Delete user by ID
app.delete('/users/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.execute('DELETE FROM users WHERE id=?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// 404 handler - Must be AFTER all other routes
app.all('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware - Must be LAST
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});