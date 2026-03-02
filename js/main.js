// Ethereal Garden Wedding Website - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize AOS Animation Library
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });
    
    // Navbar Scroll Effect
    const navbar = document.getElementById('mainNav');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Smooth Scroll for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Countdown Timer
    function updateCountdown() {
        const weddingDate = new Date('June 15, 2025 15:00:00').getTime();
        const now = new Date().getTime();
        const distance = weddingDate - now;
        
        if (distance > 0) {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            document.getElementById('days').textContent = String(days).padStart(2, '0');
            document.getElementById('hours').textContent = String(hours).padStart(2, '0');
            document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
            document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
        } else {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
        }
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
    
    // Floating Leaves Animation
    function createLeaves() {
        const leavesContainer = document.getElementById('leaves');
        if (!leavesContainer) return;
        
        const leafSymbols = ['🍃', '🌿', '🍂', '🌱'];
        const numberOfLeaves = 15;
        
        for (let i = 0; i < numberOfLeaves; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'leaf';
            leaf.textContent = leafSymbols[Math.floor(Math.random() * leafSymbols.length)];
            leaf.style.left = Math.random() * 100 + '%';
            leaf.style.animationDuration = (Math.random() * 10 + 10) + 's';
            leaf.style.animationDelay = Math.random() * 10 + 's';
            leaf.style.fontSize = (Math.random() * 20 + 15) + 'px';
            leavesContainer.appendChild(leaf);
        }
    }
    
    createLeaves();
    
    // Map Modal Function
    window.openMap = function(location) {
        const modal = new bootstrap.Modal(document.getElementById('mapModal'));
        const mapFrame = document.getElementById('mapFrame');
        const encodedLocation = encodeURIComponent(location);
        mapFrame.src = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d100000!2d-122.5!3d38.5!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDMwJzAwLjAiTiAxMjLCsDMwJzAwLjAiVw!5e0!3m2!1sen!2sus!4v1`;
        modal.show();
    };
    
    // Gallery Image Click Handler
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', function() {
            // In a full implementation, this would open a lightbox
            // For now, we'll just add a subtle click effect
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 200);
        });
    });
    
    // Parallax Effect for Hero Section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroContent = document.querySelector('.hero-content');
        const heroBg = document.querySelector('.hero-bg');
        
        if (heroContent && heroBg) {
            heroContent.style.transform = `translateY(${scrolled * 0.4}px)`;
            heroBg.style.transform = `translateY(${scrolled * 0.2}px)`;
        }
    });
    
    // Intersection Observer for Scroll Animations (fallback for AOS)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements that need animation
    document.querySelectorAll('.detail-card, .info-box, .registry-card').forEach(el => {
        observer.observe(el);
    });
    
    // Form Validation Helper (for future RSVP form)
    window.validateEmail = function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };
    
    // Mobile Menu Close on Click
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse.classList.contains('show')) {
                navbarCollapse.classList.remove('show');
            }
        });
    });
    
    // Add loading animation for buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#' || this.getAttribute('href') === '') {
                e.preventDefault();
            }
            
            // Add ripple effect
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.width = '20px';
            ripple.style.height = '20px';
            ripple.style.background = 'rgba(255,255,255,0.5)';
            ripple.style.borderRadius = '50%';
            ripple.style.transform = 'translate(-50%, -50%)';
            ripple.style.pointerEvents = 'none';
            ripple.style.animation = 'ripple 0.6s ease-out';
            
            const rect = this.getBoundingClientRect();
            ripple.style.left = (e.clientX - rect.left) + 'px';
            ripple.style.top = (e.clientY - rect.top) + 'px';
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
    
    // Add ripple animation keyframes dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                width: 200px;
                height: 200px;
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Console greeting
    console.log('%c💕 Sarah & Michael 2025 💕', 'color: #9CAF88; font-size: 20px; font-weight: bold;');
    console.log('%cWelcome to our wedding website!', 'color: #D4AF37; font-size: 14px;');
});