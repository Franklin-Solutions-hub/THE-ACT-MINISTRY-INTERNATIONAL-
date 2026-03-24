const express = require('express');
const session = require('express-session');
const path = require('path');
const supabase = require('./database');
const multer = require('multer');

// Admin Routes
const adminRoutes = require('./routes/admin');

const app = express();

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/images')));

app.use(session({
  secret: 'act-ministry-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using https
}));

// Setup Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/images'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Pass the upload middleware to admin routes
app.use('/admin', adminRoutes(upload));

// --- PUBLIC ROUTES ---
app.get('/', async (req, res) => {
  try {
    const data = {};

    // Fetch settings
    const { data: settingsRows } = await supabase.from('settings').select('key, value');
    data.settings = {};
    (settingsRows || []).forEach(row => data.settings[row.key] = row.value);

    // Fetch events
    const { data: events } = await supabase.from('events').select('*');
    data.events = events || [];

    // Fetch ministries
    const { data: ministries } = await supabase.from('ministries').select('*');
    data.ministries = ministries || [];

    // Fetch gallery
    const { data: gallery } = await supabase.from('gallery').select('*');
    data.gallery = gallery || [];

    // Fetch sermons
    const { data: sermons } = await supabase.from('sermons').select('*');
    data.sermons = sermons || [];

    res.render('index', { data });
  } catch (err) {
    console.error('Homepage error:', err);
    res.status(500).send('Database Error');
  }
});

app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  const { error } = await supabase.from('messages').insert({ name, email, message });
  if (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Database error' });
  }
  res.json({ success: true, message: 'Message sent successfully' });
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
