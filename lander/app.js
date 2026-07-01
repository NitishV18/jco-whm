/**
 * JEAN CLAUDE OLIVIER - Interactive Application Scripts
 * Vanilla ES6 JavaScript for Premium Performance & Interactive FX
 */

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initNavbar();
  initCursorGlow();
  initScrollReveal();
  initBeforeAfterSlider();
  initTestimonials();
  initBookingForm();
  initHeroParallax();
});

/**
 * 1. Preloader simulation
 */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  const progress = document.getElementById('preloaderProgress');
  
  if (!preloader || !progress) return;
  
  // Set progress to 100% to fire the finish load
  setTimeout(() => {
    progress.style.left = '0';
    setTimeout(() => {
      preloader.style.opacity = '0';
      preloader.style.visibility = 'hidden';
    }, 600);
  }, 1800);
}

/**
 * 2. Scrolled Navbar & Mobile menu toggle
 */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky header on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Toggle mobile navigation menu
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('active');
      menuToggle.classList.toggle('active');
      
      // Animate burger menu lines
      const lines = menuToggle.querySelectorAll('span');
      if (navMenu.classList.contains('active')) {
        lines[0].style.transform = 'translateY(7px) rotate(45deg)';
        lines[1].style.opacity = '0';
        lines[2].style.transform = 'translateY(-7px) rotate(-45deg)';
      } else {
        lines[0].style.transform = 'none';
        lines[1].style.opacity = '1';
        lines[2].style.transform = 'none';
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
        const lines = menuToggle.querySelectorAll('span');
        lines[0].style.transform = 'none';
        lines[1].style.opacity = '1';
        lines[2].style.transform = 'none';
      }
    });

    // Close menu when links are clicked
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
        const lines = menuToggle.querySelectorAll('span');
        lines[0].style.transform = 'none';
        lines[1].style.opacity = '1';
        lines[2].style.transform = 'none';
      });
    });
  }
}

/**
 * 3. Custom Cursor Glow (Desktop only)
 */
function initCursorGlow() {
  const glow = document.getElementById('cursorGlow');
  if (!glow) return;

  // Simple check for touch support
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    glow.style.display = 'none';
    return;
  }

  document.addEventListener('mousemove', (e) => {
    // Offset for centering the glow element
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  });
}

/**
 * 4. Hero Mouse Parallax Effect
 */
function initHeroParallax() {
  const hero = document.getElementById('hero');
  const bgImg = hero ? hero.querySelector('.hero-bg-img') : null;
  const content = hero ? hero.querySelector('.hero-content') : null;
  const bookingCard = hero ? hero.querySelector('.booking-card-wrapper') : null;
  
  if (!hero || !bgImg) return;
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

  hero.addEventListener('mousemove', (e) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const mouseX = (e.clientX - width / 2) / (width / 2);
    const mouseY = (e.clientY - height / 2) / (height / 2);
    
    // Scale image slightly and translate opposing to mouse movement
    bgImg.style.transform = `scale(1.05) translate(${mouseX * -20}px, ${mouseY * -20}px)`;
    
    if (content) {
      content.style.transform = `translate(${mouseX * 10}px, ${mouseY * 10}px)`;
    }
    
    if (bookingCard) {
      bookingCard.style.transform = `translate(${mouseX * -10}px, ${mouseY * -10}px) rotateY(${mouseX * 5}deg) rotateX(${mouseY * -5}deg)`;
    }
  });
}

/**
 * 5. Intersection Observer Scroll Reveal Animation
 */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.scroll-reveal');
  
  const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Once revealed, we don't need to observe it anymore
        observer.unobserve(entry.target);
      }
    });
  };

  const revealObserver = new IntersectionObserver(revealCallback, {
    root: null,
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(element => {
    revealObserver.observe(element);
  });
}

/**
 * 6. Before / After Image Comparison Slider
 */
function initBeforeAfterSlider() {
  const slider = document.getElementById('beforeAfterSlider');
  const foreground = document.getElementById('foregroundImg');
  const handle = document.getElementById('sliderHandle');
  
  if (!slider || !foreground || !handle) return;
  
  let active = false;
  
  const setPosition = (x) => {
    const rect = slider.getBoundingClientRect();
    let position = ((x - rect.left) / rect.width) * 100;
    
    // Constrain slider position within bounds
    if (position < 0) position = 0;
    if (position > 100) position = 100;
    
    foreground.style.width = `${position}%`;
    handle.style.left = `${position}%`;
  };
  
  const handleStart = (e) => {
    active = true;
    e.preventDefault();
  };
  
  const handleEnd = () => {
    active = false;
  };
  
  const handleMove = (e) => {
    if (!active) return;
    let clientX;
    
    if (e.type === 'touchmove') {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    setPosition(clientX);
  };
  
  // Mouse Events
  handle.addEventListener('mousedown', handleStart);
  window.addEventListener('mouseup', handleEnd);
  window.addEventListener('mousemove', handleMove);
  
  // Touch Events (Mobile)
  handle.addEventListener('touchstart', handleStart);
  window.addEventListener('touchend', handleEnd);
  window.addEventListener('touchmove', handleMove);
  
  // Click on container moves slider
  slider.addEventListener('click', (e) => {
    if (e.target !== handle && !handle.contains(e.target)) {
      setPosition(e.clientX);
    }
  });
}

/**
 * 7. Testimonials Slider Carousel
 */
function initTestimonials() {
  const track = document.getElementById('testimonialTrack');
  const slides = document.querySelectorAll('.testimonial-slide');
  const prevBtn = document.getElementById('prevTestimonial');
  const nextBtn = document.getElementById('nextTestimonial');
  const indicators = document.querySelectorAll('#testimonialIndicators .indicator');
  
  if (!track || slides.length === 0) return;
  
  let currentIndex = 0;
  
  const updateSlider = (index) => {
    currentIndex = index;
    
    // Translate the track
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    // Toggle active slide styling
    slides.forEach((slide, i) => {
      if (i === currentIndex) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });
    
    // Update indicator dots
    indicators.forEach((indicator, i) => {
      if (i === currentIndex) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });
  };
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      let index = currentIndex - 1;
      if (index < 0) index = slides.length - 1;
      updateSlider(index);
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      let index = currentIndex + 1;
      if (index >= slides.length) index = 0;
      updateSlider(index);
    });
  }
  
  indicators.forEach(indicator => {
    indicator.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      updateSlider(index);
    });
  });

  // Auto transition every 8 seconds
  setInterval(() => {
    let index = currentIndex + 1;
    if (index >= slides.length) index = 0;
    updateSlider(index);
  }, 8000);
}

/**
 * 8. Reservation form interactive actions and modal feedback
 */
function initBookingForm() {
  const form = document.getElementById('bookingForm');
  const modal = document.getElementById('successModal');
  const closeModalBtn = document.getElementById('closeModal');
  
  if (!form || !modal) return;
  
  // Set minimal date limit (today)
  const dateInput = document.getElementById('bookingDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('bookingName').value;
    const branch = document.getElementById('bookingBranch').value;
    const service = document.getElementById('bookingService').value;
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;
    
    // Animate Booking Button during submission
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Verifying Space...</span>';
    submitBtn.disabled = true;

    // Simulate luxury API booking response
    setTimeout(() => {
      // Set details inside Success Modal
      document.getElementById('modalClientName').textContent = name;
      document.getElementById('modalBranch').textContent = branch;
      
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
      document.getElementById('modalDateTime').textContent = `${formattedDate} at ${time}`;
      
      // Open Modal
      modal.classList.add('active');
      
      // Reset form & restore button
      form.reset();
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }, 1500);
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  // Close modal clicking overlay
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
}
