const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/database');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '../../frontend')));

// API routes
app.use('/api', routes);

// Fallback to index.html (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});


app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại cổng: http://localhost:${PORT}`);
});
