// ===== DOM ELEMENTS =====
const navbar = document.querySelector('.navbar');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const navLinksItems = document.querySelectorAll('.nav-links a');

// ===== NAVBAR SCROLL =====
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  if (currentScroll > 80) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  lastScroll = currentScroll;
});

// ===== MOBILE MENU =====
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('active');
  document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
});

// Close mobile menu on link click
navLinksItems.forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navLinks.classList.remove('active');
    document.body.style.overflow = '';
  });
});

// Close mobile menu on outside click
document.addEventListener('click', (e) => {
  if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
    hamburger.classList.remove('active');
    navLinks.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const headerOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ===== SCROLL REVEAL ANIMATIONS =====
const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

// ===== DONATION AMOUNT SELECTION =====
// Logic moved to inline script in index.ejs to seamlessly interact with Paystack

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    if (!name || !email || !message) {
      showNotification('Please fill in all fields.', 'warning');
      return;
    }

    // Switch button to loading state
    const btn = contactForm.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Sending...";
    
    const data = {
        name: name,
        email: email,
        message: message
    };

    fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(async res => {
        if (!res.ok) {
            // Try to parse error as JSON, fallback to text if it's an HTML error page like 404
            let errMessage = 'Failed to send message.';
            try {
                const errorData = await res.json();
                errMessage = errorData.error || errMessage;
            } catch (e) {
                // Not JSON, perhaps 404
                if (res.status === 404) errMessage = 'Server route not found. Is the server updated?';
            }
            throw new Error(errMessage);
        }
        return res.json();
    })
    .then(data => {
        if(data.success) {
            btn.innerHTML = "<i class='bx bx-check'></i> Sent Successfully!";
            btn.style.background = "#28a745";
            contactForm.reset();
            showNotification('Thank you for your message! We will get back to you soon.', 'success');
        } else {
            throw new Error(data.error || 'Failed to send message.');
        }
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = "";
        }, 3000);
    })
    .catch(err => {
        btn.innerHTML = "<i class='bx bx-x'></i> Error";
        btn.style.background = "#dc3545";
        showNotification(err.message, 'error');
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = "";
        }, 3000);
    });
  });
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 30px;
    padding: 16px 28px;
    border-radius: 12px;
    color: #fff;
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    font-weight: 500;
    z-index: 10000;
    transform: translateX(120%);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 8px 30px rgba(0,0,0,0.2);
    max-width: 350px;
    backdrop-filter: blur(10px);
  `;

  if (type === 'success') {
    notification.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
  } else if (type === 'warning') {
    notification.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
  } else {
    notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
  }

  notification.textContent = message;
  document.body.appendChild(notification);

  requestAnimationFrame(() => {
    notification.style.transform = 'translateX(0)';
  });

  setTimeout(() => {
    notification.style.transform = 'translateX(120%)';
    setTimeout(() => notification.remove(), 400);
  }, 4000);
}

// ===== PARALLAX EFFECT ON HERO =====
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const hero = document.querySelector('.hero-bg img');
  if (hero && scrolled < window.innerHeight) {
    hero.style.transform = `translateY(${scrolled * 0.3}px)`;
  }
});

// ===== COUNTER ANIMATION =====
function animateCounter(element, target) {
  let current = 0;
  const increment = target / 60;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current);
  }, 16);
}

// ===== TYPING EFFECT FOR HERO SUBTITLE =====
const heroSubtitle = document.querySelector('.hero-subtitle');
if (heroSubtitle) {
  const originalText = heroSubtitle.innerHTML;
  // Already displayed, just add a subtle glow animation after load
  setTimeout(() => {
    heroSubtitle.style.textShadow = '0 0 20px rgba(212, 168, 67, 0.3)';
    setTimeout(() => {
      heroSubtitle.style.textShadow = 'none';
    }, 1500);
  }, 2000);
}

// ===== ACTIVE NAV LINK ON SCROLL =====
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.pageYOffset >= sectionTop - 200) {
      current = section.getAttribute('id');
    }
  });

  navLinksItems.forEach(link => {
    link.style.color = '';
    if (link.getAttribute('href') === `#${current}`) {
      link.style.color = '#d4a843';
    }
  });
});

// ===== PRELOADER / PAGE LOAD =====
window.addEventListener('load', () => {
  document.body.style.opacity = '1';
  // Trigger hero animations
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    heroContent.style.opacity = '1';
  }
});
