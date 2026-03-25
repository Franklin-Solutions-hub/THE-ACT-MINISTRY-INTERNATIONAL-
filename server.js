const express = require('express');
const session = require('express-session');
const path = require('path');
const compression = require('compression');
const supabase = require('./database');
const multer = require('multer');

// Admin Routes
const adminRoutes = require('./routes/admin');

const app = express();

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Performance: Gzip compression for all responses
app.use(compression());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Performance: Cache static assets (CSS, JS, images) for 7 days
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '7d',
  etag: true
}));

app.use(session({
  secret: 'act-ministry-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// ====== SUPABASE STORAGE HELPERS ======
const SUPABASE_BUCKET = 'media';

// Upload file buffer to Supabase Storage and return the public URL
async function uploadToSupabase(fileBuffer, originalName, mimetype) {
  const fileName = Date.now() + '-' + originalName.replace(/\s+/g, '_');
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(fileName, fileBuffer, {
      contentType: mimetype,
      upsert: false
    });

  if (error) {
    console.error('Supabase upload error:', error.message);
    return null;
  }

  // Get the permanent public URL
  const { data: urlData } = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

// Delete file from Supabase Storage by its full URL
async function deleteFromSupabase(publicUrl) {
  if (!publicUrl || publicUrl.startsWith('/images/')) return; // Skip default/local images
  try {
    // Extract the file name from the full Supabase URL
    const parts = publicUrl.split('/storage/v1/object/public/' + SUPABASE_BUCKET + '/');
    if (parts.length < 2) return;
    const fileName = decodeURIComponent(parts[1]);
    await supabase.storage.from(SUPABASE_BUCKET).remove([fileName]);
  } catch (e) {
    console.error('Supabase delete error:', e.message);
  }
}

// Setup Multer for MEMORY storage (no local disk writes)
const upload = multer({ storage: multer.memoryStorage() });

// Make helpers available to admin routes
app.locals.uploadToSupabase = uploadToSupabase;
app.locals.deleteFromSupabase = deleteFromSupabase;

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

// --- LEADERSHIP PAGE ---
app.get('/leadership', async (req, res) => {
  try {
    const data = {};

    // Fetch settings for navbar/footer
    const { data: settingsRows } = await supabase.from('settings').select('key, value');
    data.settings = {};
    (settingsRows || []).forEach(row => data.settings[row.key] = row.value);

    // Fetch leaders ordered by display_order
    const { data: leaders, error: leadersError } = await supabase.from('leaders').select('*').order('display_order', { ascending: true });
    if (leadersError) {
      console.error('Leaders fetch error:', leadersError.message);
    }
    data.leaders = leaders || [];

    res.render('leadership', { data });
  } catch (err) {
    console.error('Leadership page error:', err);
    res.status(500).send('Database Error');
  }
});

// --- SERMONS PAGE ---
app.get('/sermons', async (req, res) => {
  try {
    const data = {};
    // Fetch settings for navbar/footer
    const { data: settingsRows } = await supabase.from('settings').select('key, value');
    data.settings = {};
    (settingsRows || []).forEach(row => data.settings[row.key] = row.value);

    // Fetch sermons
    const { data: sermons } = await supabase.from('sermons').select('*');
    data.sermons = sermons || [];

    res.render('sermons', { data });
  } catch (err) {
    console.error('Sermons page error:', err);
    res.status(500).send('Database Error');
  }
});

// --- SERMON DETAILS PAGE ---
app.get('/sermons/:id', async (req, res) => {
  try {
    const data = {};
    const { data: settingsRows } = await supabase.from('settings').select('key, value');
    data.settings = {};
    (settingsRows || []).forEach(row => data.settings[row.key] = row.value);

    // Fetch the specific sermon
    const { data: sermons } = await supabase.from('sermons').select('*').eq('id', req.params.id).limit(1);
    if (!sermons || sermons.length === 0) {
      return res.status(404).send('Sermon not found');
    }
    data.sermon = sermons[0];

    res.render('sermon-details', { data });
  } catch (err) {
    console.error('Sermon details page error:', err);
    res.status(500).send('Database Error');
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
