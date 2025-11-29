const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// CREATE
app.post('/users', (req, res) => {
  const { name, email, age } = req.body;
  db.query(
    'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
    [name, email, age],
    (err, result) => {
      if (err) return res.json({ error: err });
      res.json({ message: 'User added', id: result.insertId });
    }
  );
});

// READ
app.get('/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) return res.json({ error: err });
    res.json(results);
  });
});

// UPDATE
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, age } = req.body;
  db.query(
    'UPDATE users SET name=?, email=?, age=? WHERE id=?',
    [name, email, age, id],
    (err) => {
      if (err) return res.json({ error: err });
      res.json({ message: 'User updated' });
    }
  );
});

// DELETE
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM users WHERE id=?', [id], (err) => {
    if (err) return res.json({ error: err });
    res.json({ message: 'User deleted' });
  });
});


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
