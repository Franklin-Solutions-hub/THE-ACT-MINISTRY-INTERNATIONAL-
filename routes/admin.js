const express = require('express');
const bcrypt = require('bcrypt');
const supabase = require('../database');
const fs = require('fs');
const path = require('path');

module.exports = function(upload) {
  const router = express.Router();

  // --- MIDDLEWARE: Auth Check ---
  const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
      return next();
    }
    res.redirect('/admin/login');
  };

  // --- AUTH ROUTES ---
  router.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/admin');
    res.render('admin-login', { error: null });
  });

  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const { data: users, error } = await supabase.from('users').select('*').eq('username', username).limit(1);
    if (error || !users || users.length === 0) {
      return res.render('admin-login', { error: 'Invalid username or password' });
    }
    const user = users[0];
    if (bcrypt.compareSync(password, user.password)) {
      req.session.userId = user.id;
      res.redirect('/admin');
    } else {
      res.render('admin-login', { error: 'Invalid username or password' });
    }
  });

  router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
  });

  // --- DASHBOARD ROUTE ---
  router.get('/', isAuthenticated, async (req, res) => {
    try {
      const data = {};

      const { data: settingsRows } = await supabase.from('settings').select('key, value');
      data.settings = {};
      (settingsRows || []).forEach(row => data.settings[row.key] = row.value);

      const { data: events } = await supabase.from('events').select('*');
      data.events = events || [];

      const { data: ministries } = await supabase.from('ministries').select('*');
      data.ministries = ministries || [];

      const { data: gallery } = await supabase.from('gallery').select('*');
      data.gallery = gallery || [];

      const { data: sermons } = await supabase.from('sermons').select('*');
      data.sermons = sermons || [];

      const { data: messages } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
      data.messages = messages || [];

      const { data: leaders } = await supabase.from('leaders').select('*').order('display_order', { ascending: true });
      data.leaders = leaders || [];

      res.render('admin-dashboard', { data, msg: req.query.msg });
    } catch (err) {
      console.error('Dashboard error:', err);
      res.status(500).send('Database Error');
    }
  });

  // --- UPDATE SETTINGS ---
  router.post('/settings', isAuthenticated, async (req, res) => {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
    }
    res.redirect('/admin?msg=Settings Updated');
  });

  // --- HERO BANNER UPLOAD/DELETE ---
  router.post('/settings/hero', isAuthenticated, upload.single('hero_image'), async (req, res) => {
    if (req.file) {
      // Find old image to delete (if not default)
      const { data: rows } = await supabase.from('settings').select('value').eq('key', 'hero_banner_url').limit(1);
      if (rows && rows.length > 0 && rows[0].value && rows[0].value.startsWith('/images/') && rows[0].value !== '/images/worship-flyer.png') {
        const oldPath = path.join(__dirname, '../public', rows[0].value);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      const imageUrl = '/images/' + req.file.filename;
      await supabase.from('settings').upsert({ key: 'hero_banner_url', value: imageUrl }, { onConflict: 'key' });
      res.redirect('/admin?msg=Hero Banner Updated');
    } else {
      res.redirect('/admin?msg=Upload failed');
    }
  });

  router.post('/settings/hero/delete', isAuthenticated, async (req, res) => {
    const { data: rows } = await supabase.from('settings').select('value').eq('key', 'hero_banner_url').limit(1);
    if (rows && rows.length > 0 && rows[0].value && rows[0].value.startsWith('/images/') && rows[0].value !== '/images/worship-flyer.png') {
      const filePath = path.join(__dirname, '../public', rows[0].value);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await supabase.from('settings').upsert({ key: 'hero_banner_url', value: '/images/worship-flyer.png' }, { onConflict: 'key' });
    res.redirect('/admin?msg=Hero Banner Reset to Default');
  });

  // --- EVENTS ---
  router.post('/events', isAuthenticated, async (req, res) => {
    const { title, time, location, icon, description } = req.body || {};
    await supabase.from('events').insert({ title, time: time || '', location: location || '', icon, description });
    res.redirect('/admin?msg=Event Added');
  });

  router.post('/events/edit/:id', isAuthenticated, async (req, res) => {
    const { title, time, location, icon, description } = req.body || {};
    await supabase.from('events').update({ title, time, location, icon, description }).eq('id', req.params.id);
    res.redirect('/admin?msg=Event Updated');
  });

  router.post('/events/delete/:id', isAuthenticated, async (req, res) => {
    await supabase.from('events').delete().eq('id', req.params.id);
    res.redirect('/admin?msg=Event Deleted');
  });

  // --- MINISTRIES ---
  router.post('/ministries', isAuthenticated, async (req, res) => {
    const { title, description, icon } = req.body || {};
    await supabase.from('ministries').insert({ title, description, icon });
    res.redirect('/admin?msg=Ministry Added');
  });

  router.post('/ministries/edit/:id', isAuthenticated, async (req, res) => {
    const { title, description, icon } = req.body || {};
    await supabase.from('ministries').update({ title, description, icon }).eq('id', req.params.id);
    res.redirect('/admin?msg=Ministry Updated');
  });

  router.post('/ministries/delete/:id', isAuthenticated, async (req, res) => {
    await supabase.from('ministries').delete().eq('id', req.params.id);
    res.redirect('/admin?msg=Ministry Deleted');
  });

  // --- SERMONS ---
  router.post('/sermons', isAuthenticated, upload.single('sermon_video'), async (req, res) => {
    const { title, description } = req.body || {};
    let video_url = (req.body && req.body.video_url) ? req.body.video_url : '';

    if (req.file) {
      video_url = '/images/' + req.file.filename;
    }

    await supabase.from('sermons').insert({ title, description, video_url });
    res.redirect('/admin?msg=Sermon Added');
  });

  router.post('/sermons/edit/:id', isAuthenticated, upload.single('sermon_video'), async (req, res) => {
    const { title, description, video_url } = req.body || {};
    const updateData = { title, description };
    if (req.file) {
      updateData.video_url = '/images/' + req.file.filename;
    } else if (video_url !== undefined) {
      updateData.video_url = video_url;
    }
    await supabase.from('sermons').update(updateData).eq('id', req.params.id);
    res.redirect('/admin?msg=Sermon Updated');
  });

  router.post('/sermons/delete/:id', isAuthenticated, async (req, res) => {
    // Check if there is an associated local video file to delete
    const { data: rows } = await supabase.from('sermons').select('video_url').eq('id', req.params.id).limit(1);
    if (rows && rows.length > 0 && rows[0].video_url && rows[0].video_url.startsWith('/images/')) {
      const filePath = path.join(__dirname, '../public', rows[0].video_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await supabase.from('sermons').delete().eq('id', req.params.id);
    res.redirect('/admin?msg=Sermon Deleted');
  });

  // --- GALLERY (IMAGE UPLOADS) ---
  router.post('/gallery', isAuthenticated, upload.single('image'), async (req, res) => {
    const caption = req.body.caption || '';
    if (req.file) {
      const imageUrl = '/images/' + req.file.filename;
      await supabase.from('gallery').insert({ image_url: imageUrl, caption });
      res.redirect('/admin?msg=Image Uploaded');
    } else {
      res.redirect('/admin?msg=Upload failed');
    }
  });

  router.post('/gallery/edit/:id', isAuthenticated, upload.single('image'), async (req, res) => {
    const caption = req.body.caption || '';
    const updateData = { caption };
    if (req.file) {
      // Find old image to delete
      const { data: rows } = await supabase.from('gallery').select('image_url').eq('id', req.params.id).limit(1);
      if (rows && rows.length > 0 && rows[0].image_url && rows[0].image_url.startsWith('/images/')) {
        const oldPath = path.join(__dirname, '../public', rows[0].image_url);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updateData.image_url = '/images/' + req.file.filename;
    }
    await supabase.from('gallery').update(updateData).eq('id', req.params.id);
    res.redirect('/admin?msg=Media Updated');
  });

  router.post('/gallery/delete/:id', isAuthenticated, async (req, res) => {
    const { data: rows } = await supabase.from('gallery').select('image_url').eq('id', req.params.id).limit(1);
    if (rows && rows.length > 0 && rows[0].image_url) {
      const filePath = path.join(__dirname, '../public', rows[0].image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await supabase.from('gallery').delete().eq('id', req.params.id);
    res.redirect('/admin?msg=Image Deleted');
  });

  // --- MESSAGES ---
  router.post('/messages/delete/:id', isAuthenticated, async (req, res) => {
    await supabase.from('messages').delete().eq('id', req.params.id);
    res.redirect('/admin?msg=Message Deleted');
  });

  // --- LEADERS ---
  router.post('/leaders', isAuthenticated, upload.single('leader_image'), async (req, res) => {
    const { name, position, short_bio, full_bio, social_whatsapp, social_facebook, display_order, is_featured } = req.body || {};
    let image_url = '';
    if (req.file) {
      image_url = '/images/' + req.file.filename;
    }
    const social_links = JSON.stringify({
      whatsapp: social_whatsapp || '',
      facebook: social_facebook || ''
    });
    await supabase.from('leaders').insert({
      name, position, short_bio, full_bio: full_bio || '',
      image_url, social_links,
      is_featured: is_featured === 'on',
      display_order: parseInt(display_order) || 0
    });
    res.redirect('/admin?msg=Leader Added');
  });

  router.post('/leaders/edit/:id', isAuthenticated, upload.single('leader_image'), async (req, res) => {
    const { name, position, short_bio, full_bio, social_whatsapp, social_facebook, display_order, is_featured } = req.body || {};
    const social_links = JSON.stringify({
      whatsapp: social_whatsapp || '',
      facebook: social_facebook || ''
    });
    const updateData = {
      name, position, short_bio, full_bio: full_bio || '',
      social_links,
      is_featured: is_featured === 'on',
      display_order: parseInt(display_order) || 0,
      updated_at: new Date().toISOString()
    };
    if (req.file) {
      // Delete old image if it exists locally
      const { data: rows } = await supabase.from('leaders').select('image_url').eq('id', req.params.id).limit(1);
      if (rows && rows.length > 0 && rows[0].image_url && rows[0].image_url.startsWith('/images/')) {
        const oldPath = path.join(__dirname, '../public', rows[0].image_url);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updateData.image_url = '/images/' + req.file.filename;
    }
    await supabase.from('leaders').update(updateData).eq('id', req.params.id);
    res.redirect('/admin?msg=Leader Updated');
  });

  router.post('/leaders/delete/:id', isAuthenticated, async (req, res) => {
    const { data: rows } = await supabase.from('leaders').select('image_url').eq('id', req.params.id).limit(1);
    if (rows && rows.length > 0 && rows[0].image_url && rows[0].image_url.startsWith('/images/')) {
      const filePath = path.join(__dirname, '../public', rows[0].image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await supabase.from('leaders').delete().eq('id', req.params.id);
    res.redirect('/admin?msg=Leader Deleted');
  });

  return router;
};
