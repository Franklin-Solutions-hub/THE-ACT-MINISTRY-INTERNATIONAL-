require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ===== Initialize Database Tables =====
async function initializeDatabase() {
  console.log('Connecting to Supabase...');

  // Create tables using Supabase SQL (via RPC or direct queries)
  // We'll create tables if they don't exist using the REST API approach
  
  // --- Users table ---
  try {
    const { data: existingUsers } = await supabase.from('users').select('id').limit(1);
    // Table exists, check if empty
    if (!existingUsers || existingUsers.length === 0) {
      const hash = bcrypt.hashSync('admin123', 10);
      await supabase.from('users').insert({ username: 'admin', password: hash });
      console.log('Default admin created (admin / admin123)');
    }
  } catch (e) {
    console.log('Note: "users" table may need to be created in Supabase. See console for details.');
    console.error(e.message);
  }

  // --- Settings table ---
  try {
    const { data: existingSettings } = await supabase.from('settings').select('id').limit(1);
    if (!existingSettings || existingSettings.length === 0) {
      const defaultSettings = [
        { key: 'hero_title', value: 'Join Us In <span>Worship</span>' },
        { key: 'hero_subtitle', value: '<strong>Pray</strong> &nbsp;||&nbsp; <strong>Worship</strong> &nbsp;||&nbsp; <strong>Share the Word</strong> &nbsp;||&nbsp; <strong>Encounter</strong> &nbsp;||&nbsp; <strong>Prophecies & Deliverance</strong>' },
        { key: 'watch_live_link', value: 'https://www.youtube.com' },
        { key: 'about_text', value: 'Under the visionary leadership of <strong>Prophet Samuel Eghan Gorman</strong>, the ministry has grown into a vibrant community of believers committed to experiencing God\'s transformative power. Every service is an opportunity for supernatural encounters, prophetic declarations, and Spirit-led worship.<br><br>We believe in the apostolic mandate — to raise a generation that walks in the fullness of God\'s purpose, power, and promise.' },
        { key: 'contact_address', value: 'Church Premises, Off The Accountant General Dept – Dansoman, Accra' },
        { key: 'contact_phone1', value: '+233 54 786 0070' },
        { key: 'contact_phone2', value: '+233 54 678 7245' },
        { key: 'contact_phone3', value: '+233 54 621 0288' },
        { key: 'contact_email', value: 'info@actministry.org' },
        { key: 'paystack_public_key', value: '' },
        { key: 'hero_banner_url', value: '/images/worship-flyer.png' },
        { key: 'event_flyer_url', value: '/images/worship-flyer.png' }
      ];
      await supabase.from('settings').insert(defaultSettings);
      console.log('Default settings seeded.');
    }
  } catch (e) {
    console.log('Note: "settings" table may need to be created in Supabase.');
    console.error(e.message);
  }

  // --- Events table ---
  try {
    const { data: existingEvents } = await supabase.from('events').select('id').limit(1);
    if (!existingEvents || existingEvents.length === 0) {
      await supabase.from('events').insert([
        { title: 'This and Every Friday', time: '', location: '', icon: 'calendar', description: 'Weekly worship service — come and experience the overflow of God\'s power.' },
        { title: '6:30 PM – 10:00 PM', time: '', location: '', icon: 'clock', description: 'Each Night — A powerful time of prayer, praise, and prophetic encounters.' },
        { title: 'Church Premises', time: '', location: '', icon: 'location', description: 'Off The Accountant General Dept – Dansoman, Accra' },
        { title: 'Contact Us', time: '', location: '', icon: 'phone', description: 'Call us for directions or inquiries.' }
      ]);
      console.log('Default events seeded.');
    }
  } catch (e) {
    console.log('Note: "events" table may need to be created in Supabase.');
    console.error(e.message);
  }

  // --- Ministries table ---
  try {
    const { data: existingMin } = await supabase.from('ministries').select('id').limit(1);
    if (!existingMin || existingMin.length === 0) {
      await supabase.from('ministries').insert([
        { title: 'Prayer Ministry', description: 'Fervent intercession and corporate prayer meetings that shake the heavens and bring breakthrough.', icon: '🙏' },
        { title: 'Worship Team', description: 'Spirit-led worship that ushers in God\'s presence. Our worship team leads the church into powerful encounters with God.', icon: '🎶' },
        { title: 'Word & Teaching', description: 'Sound biblical teaching and discipleship programs that ground believers in the truth of God\'s word.', icon: '📖' },
        { title: 'Prophetic & Deliverance', description: 'Prophetic ministry and deliverance sessions where chains are broken and destinies are unlocked by the Spirit of God.', icon: '🔥' }
      ]);
      console.log('Default ministries seeded.');
    }
  } catch (e) {
    console.log('Note: "ministries" table may need to be created in Supabase.');
    console.error(e.message);
  }

  // --- Gallery table ---
  try {
    const { data: existingGallery } = await supabase.from('gallery').select('id').limit(1);
    if (!existingGallery || existingGallery.length === 0) {
      await supabase.from('gallery').insert([
        { image_url: '/images/1769962094_5c5d9c86a60b.jpeg', caption: 'Ministry in Action' },
        { image_url: '/images/symphony-of-praiz-2025.png', caption: 'Symphony of Praiz 2025' },
        { image_url: '/images/1769962736_854b21f4712e.jpeg', caption: 'Church Service' },
        { image_url: '/images/1769963009_7e1598e002c4.jpeg', caption: 'Revival Event' },
        { image_url: '/images/pastor-birthday.png', caption: 'Happy Birthday Prophet!' },
        { image_url: '/images/1769963995_7e6f0e956f59.jpeg', caption: 'Our Church Family' }
      ]);
      console.log('Default gallery seeded.');
    }
  } catch (e) {
    console.log('Note: "gallery" table may need to be created in Supabase.');
    console.error(e.message);
  }

  // --- Sermons table ---
  try {
    const { data: existingSermons } = await supabase.from('sermons').select('id').limit(1);
    if (!existingSermons || existingSermons.length === 0) {
      await supabase.from('sermons').insert([
        { title: 'Sunday Worship Experience', description: 'Experience the power of God through our worship services.', video_url: '', category: 'Faith', is_featured: true, preacher: 'Prophet Samuel Eghan Gorman' },
        { title: 'Prophetic Encounter Night', description: 'A night of divine encounters, prophecies, and deliverance.', video_url: '', category: 'Prophecy', preacher: 'Prophet Samuel Eghan Gorman' },
        { title: 'Word & Teaching Series', description: 'Deep study of scripture to equip the saints for every good work.', video_url: '', category: 'Teaching', preacher: 'Prophet Samuel Eghan Gorman' },
        { title: 'Prayer & Deliverance Service', description: 'Breaking every chain and walking in the freedom of Christ.', video_url: '', category: 'Prayer', preacher: 'Prophet Samuel Eghan Gorman' }
      ]);
      console.log('Default sermons seeded.');
    }
  } catch (e) {
    console.log('Note: "sermons" table may need to be created in Supabase.');
    console.error(e.message);
  }

  // --- Messages table (no seed data needed) ---

  // --- Leaders table ---
  try {
    const { data: existingLeaders } = await supabase.from('leaders').select('id').limit(1);
    if (!existingLeaders || existingLeaders.length === 0) {
      await supabase.from('leaders').insert([
        {
          name: 'Prophet Samuel Eghan Gorman',
          position: 'Founder & Senior Pastor',
          short_bio: 'Under his visionary leadership, ACT Ministry International has grown into a vibrant community of believers committed to experiencing God\'s transformative power.',
          full_bio: 'Prophet Samuel Eghan Gorman is the founder of Apostolic Core Team Ministry International. Under his visionary leadership, the ministry has grown into a vibrant community of believers committed to experiencing God\'s transformative power. Every service is an opportunity for supernatural encounters, prophetic declarations, and Spirit-led worship.',
          image_url: '/images/head-pastor.png',
          social_links: JSON.stringify({ whatsapp: '+233547860070' }),
          is_featured: true,
          display_order: 1
        }
      ]);
      console.log('Default leaders seeded.');
    }
  } catch (e) {
    console.log('Note: "leaders" table may need to be created in Supabase.');
    console.error(e.message);
  }

  console.log('Supabase database initialization complete.');
}

// Run initialization
initializeDatabase().catch(err => {
  console.error('Database initialization error:', err);
});

module.exports = supabase;
