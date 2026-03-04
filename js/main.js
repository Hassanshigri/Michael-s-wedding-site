// Ethereal Garden Wedding Website - Premium JavaScript

document.addEventListener('DOMContentLoaded', function () {

    // Initialize AOS Animation Library with custom settings
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100,
        easing: 'ease-out-cubic',
        mirror: false
    });

    // Initialize GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // ===================================
    // NAVBAR EFFECTS
    // ===================================
    const navbar = document.getElementById('mainNav');
    let lastScroll = 0;

    window.addEventListener('scroll', function () {
        const currentScroll = window.pageYOffset;

        // Add/remove scrolled class
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Hide/show on scroll direction (mobile friendly)
        // Only hide navbar when scrolling down past 100px threshold
        if (currentScroll > lastScroll && currentScroll > 100) {
            navbar.style.transform = 'translateY(-100%)';
            navbar.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
            navbar.style.transform = 'translateY(0)';
            navbar.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }

        lastScroll = currentScroll;
    });

    // Smooth Scroll for Navigation Links with offset
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);

            if (target) {
                const offset = 80; // navbar height
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                    bsCollapse.hide();
                }
            }
        });
    });

    // ===================================
    // COUNTDOWN TIMER with Circular Progress
    // ===================================
    function updateCountdown() {
        const weddingDate = new Date('June 15, 2025 15:00:00').getTime();
        const now = new Date().getTime();
        const distance = weddingDate - now;

        if (distance > 0) {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Update numbers
            document.getElementById('days').textContent = String(days).padStart(2, '0');
            document.getElementById('hours').textContent = String(hours).padStart(2, '0');
            document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
            document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');

            // Update circular progress
            const maxDays = 365;
            const maxHours = 24;
            const maxMinutes = 60;
            const maxSeconds = 60;

            updateCircle('days-circle', days, maxDays);
            updateCircle('hours-circle', hours, maxHours);
            updateCircle('minutes-circle', minutes, maxMinutes);
            updateCircle('seconds-circle', seconds, maxSeconds);
        } else {
            // Wedding day!
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
        }
    }

    function updateCircle(id, value, max) {
        const circle = document.getElementById(id);
        if (circle) {
            const circumference = 2 * Math.PI * 45; // r=45
            const offset = circumference - (value / max) * circumference;
            circle.style.strokeDashoffset = offset;
        }
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

    // RSVP Countdown
    function updateRSVPCountdown() {
        const rsvpDate = new Date('May 1, 2025').getTime();
        const now = new Date().getTime();
        const distance = rsvpDate - now;

        if (distance > 0) {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const rsvpElement = document.getElementById('rsvp-countdown');
            if (rsvpElement) {
                rsvpElement.textContent = days + ' days left to RSVP';
            }
        }
    }
    updateRSVPCountdown();

    // ===================================
    // FLOATING PETALS ANIMATION
    // ===================================
    function createPetals() {
        const petalsContainer = document.getElementById('petals');
        if (!petalsContainer) return;

        const petalSymbols = ['🌸', '🌺', '🌿', '🍃', '✿', '❀'];
        const numberOfPetals = 20;

        for (let i = 0; i < numberOfPetals; i++) {
            const petal = document.createElement('div');
            petal.className = 'petal';
            petal.textContent = petalSymbols[Math.floor(Math.random() * petalSymbols.length)];
            petal.style.left = Math.random() * 100 + '%';
            petal.style.animationDuration = (Math.random() * 15 + 15) + 's';
            petal.style.animationDelay = Math.random() * 15 + 's';
            petal.style.fontSize = (Math.random() * 15 + 15) + 'px';
            petal.style.opacity = Math.random() * 0.4 + 0.3;
            petalsContainer.appendChild(petal);
        }
    }
    createPetals();

    // ===================================
    // MAGNETIC BUTTON EFFECT
    // ===================================
    const magneticBtns = document.querySelectorAll('.magnetic-btn');

    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            this.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });

        btn.addEventListener('mouseleave', function () {
            this.style.transform = 'translate(0, 0)';
        });
    });

    // ===================================
    // MAP MODAL FUNCTION
    // ===================================
    window.openMap = function (location) {
        const modal = new bootstrap.Modal(document.getElementById('mapModal'));
        const mapFrame = document.getElementById('mapFrame');
        const directionsBtn = document.getElementById('directionsBtn');

        // Encode location for Google Maps
        const encodedLocation = encodeURIComponent(location);
        const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d100000!2d-122.286!3d38.2975!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDE3JzUxLjAiTiAxMjLCsDE3JzA5LjYiVw!5e0!3m2!1sen!2sus!4v1`;

        mapFrame.src = mapUrl;

        if (directionsBtn) {
            directionsBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;
        }

        modal.show();
    };

    // ===================================
    // GALLERY INTERACTIONS
    // ===================================
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach(item => {
        item.addEventListener('click', function () {
            // Create lightbox effect
            const img = this.querySelector('img');
            const lightbox = document.createElement('div');
            lightbox.className = 'lightbox';
            lightbox.innerHTML = `
                <div class="lightbox-overlay"></div>
                <div class="lightbox-content">
                    <img src="${img.src}" alt="${img.alt}">
                    <button class="lightbox-close"><i class="fas fa-times"></i></button>
                </div>
            `;

            document.body.appendChild(lightbox);
            document.body.style.overflow = 'hidden';

            // Animate in
            setTimeout(() => {
                lightbox.classList.add('active');
            }, 10);

            // Close handlers
            const closeLightbox = () => {
                lightbox.classList.remove('active');
                setTimeout(() => {
                    lightbox.remove();
                    document.body.style.overflow = '';
                }, 300);
            };

            lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
            lightbox.querySelector('.lightbox-overlay').addEventListener('click', closeLightbox);

            // Close on escape key
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') closeLightbox();
            });
        });

        // Tilt effect on hover
        item.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
        });

        item.addEventListener('mouseleave', function () {
            this.style.transform = '';
        });
    });

    // Add lightbox styles dynamically
    const lightboxStyles = document.createElement('style');
    lightboxStyles.textContent = `
        .lightbox {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s;
        }
        .lightbox.active { opacity: 1; }
        .lightbox-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            backdrop-filter: blur(10px);
        }
        .lightbox-content {
            position: relative;
            z-index: 1;
            max-width: 90%;
            max-height: 90%;
            transform: scale(0.8);
            transition: transform 0.3s;
        }
        .lightbox.active .lightbox-content { transform: scale(1); }
        .lightbox-content img {
            max-width: 100%;
            max-height: 85vh;
            border-radius: 10px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        }
        .lightbox-close {
            position: absolute;
            top: -50px;
            right: 0;
            background: none;
            border: none;
            color: white;
            font-size: 2rem;
            cursor: pointer;
            transition: transform 0.3s;
        }
        .lightbox-close:hover { transform: rotate(90deg); }
    `;
    document.head.appendChild(lightboxStyles);

    // ===================================
    // PARALLAX EFFECTS
    // ===================================
    window.addEventListener('scroll', function () {
        const scrolled = window.pageYOffset;

        // Hero parallax
        const heroContent = document.querySelector('.hero-content');
        const heroBg = document.querySelector('.hero-bg');

        if (heroContent && heroBg && scrolled < window.innerHeight) {
            heroContent.style.transform = `translateY(${scrolled * 0.4}px)`;
            heroBg.style.transform = `translateY(${scrolled * 0.2}px)`;
        }

        // Story images parallax
        const storyImages = document.querySelector('.story-images');
        if (storyImages) {
            const rect = storyImages.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const speed = 0.1;
                const yPos = (window.innerHeight - rect.top) * speed;
                storyImages.style.transform = `translateY(${yPos}px)`;
            }
        }
    });

    // ===================================
    // INTERSECTION OBSERVER for additional animations
    // ===================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');

                // Special animations for specific elements
                if (entry.target.classList.contains('detail-card')) {
                    entry.target.style.animationDelay = `${Math.random() * 0.3}s`;
                }
            }
        });
    }, observerOptions);

    // Observe elements
    document.querySelectorAll('.detail-card, .info-box, .registry-card, .timeline-item').forEach(el => {
        observer.observe(el);
    });

    // ===================================
    // RIPPLE EFFECT for buttons
    // ===================================
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            if (this.getAttribute('href') === '#' || this.getAttribute('href') === '') {
                e.preventDefault();
            }

            // Create ripple
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255,255,255,0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple-effect 0.6s ease-out;
                pointer-events: none;
            `;

            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add ripple animation
    const rippleAnimation = document.createElement('style');
    rippleAnimation.textContent = `
        @keyframes ripple-effect {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(rippleAnimation);

    // ===================================
    // TILT EFFECT for cards
    // ===================================
    const tiltCards = document.querySelectorAll('.detail-card, .info-box, .registry-card');

    tiltCards.forEach(card => {
        card.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 30;
            const rotateY = (centerX - x) / 30;

            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = '';
        });
    });

    // ===================================
    // SCROLL PROGRESS INDICATOR
    // ===================================
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, var(--sage), var(--gold));
        z-index: 10000;
        transition: width 0.1s;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', function () {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });

    // ===================================
    // FORM VALIDATION HELPERS
    // ===================================
    window.validateEmail = function (email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    window.validatePhone = function (phone) {
        const re = /^[\d\s\-\+\(\)]+$/;
        return re.test(phone) && phone.length >= 10;
    };

    // ===================================
    // MOBILE MENU IMPROVEMENTS
    // ===================================
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');

    if (navbarToggler && navbarCollapse) {
        // Close menu when clicking outside
        document.addEventListener('click', function (e) {
            if (!navbar.contains(e.target) && navbarCollapse.classList.contains('show')) {
                const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                bsCollapse.hide();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && navbarCollapse.classList.contains('show')) {
                const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                bsCollapse.hide();
            }
        });
    }

    // ===================================
    // LAZY LOADING for images
    // ===================================
    const lazyImages = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));

    // ===================================
    // CONSOLE GREETING
    // ===================================
    console.log('%c💕 Sarah & Michael 2025 💕', 'color: #9CAF88; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);');
    console.log('%cWelcome to our wedding website!', 'color: #D4AF37; font-size: 16px; font-style: italic;');
    console.log('%cBuilt with love by [Your Name]', 'color: #7A8F6A; font-size: 12px;');

    // ===================================
    // SMOOTH REVEAL for sections
    // ===================================
    const sections = document.querySelectorAll('section');

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(section => {
        section.classList.add('section-hidden');
        sectionObserver.observe(section);
    });

    // Add section reveal styles
    const sectionStyles = document.createElement('style');
    sectionStyles.textContent = `
        .section-hidden {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .section-hidden.revealed {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(sectionStyles);

    // ===================================
    // CURSOR EFFECT (desktop only)
    // ===================================
    if (window.matchMedia('(pointer: fine)').matches) {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.style.cssText = `
            width: 20px;
            height: 20px;
            border: 2px solid var(--gold);
            border-radius: 50%;
            position: fixed;
            pointer-events: none;
            z-index: 99999;
            transition: transform 0.2s, opacity 0.2s;
            mix-blend-mode: difference;
        `;
        document.body.appendChild(cursor);

        const cursorDot = document.createElement('div');
        cursorDot.className = 'cursor-dot';
        cursorDot.style.cssText = `
            width: 6px;
            height: 6px;
            background: var(--gold);
            border-radius: 50%;
            position: fixed;
            pointer-events: none;
            z-index: 99999;
            transition: transform 0.1s;
        `;
        document.body.appendChild(cursorDot);

        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            cursorDot.style.left = mouseX - 3 + 'px';
            cursorDot.style.top = mouseY - 3 + 'px';
        });

        function animateCursor() {
            cursorX += (mouseX - cursorX) * 0.1;
            cursorY += (mouseY - cursorY) * 0.1;

            cursor.style.left = cursorX - 10 + 'px';
            cursor.style.top = cursorY - 10 + 'px';

            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Hover effects
        const hoverElements = document.querySelectorAll('a, button, .gallery-item, .detail-card');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform = 'scale(2)';
                cursor.style.borderColor = 'var(--sage)';
            });
            el.addEventListener('mouseleave', () => {
                cursor.style.transform = 'scale(1)';
                cursor.style.borderColor = 'var(--gold)';
            });
        });
    }
});