// ================================
// CUSTOM CURSOR
// ================================

const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';

    setTimeout(() => {
        cursorFollower.style.left = e.clientX + 'px';
        cursorFollower.style.top = e.clientY + 'px';
    }, 100);
});

// Expand cursor on hover
document.querySelectorAll('a, button, .project-card, .contact-item, .project-split').forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursor.style.width = '40px';
        cursor.style.height = '40px';
    });
    el.addEventListener('mouseleave', () => {
        cursor.style.width = '20px';
        cursor.style.height = '20px';
    });
});

// ================================
// SMOOTH SCROLLING
// ================================

document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
});

// ================================
// NAVIGATION BACKGROUND ON SCROLL
// ================================

const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// ================================
// SCROLL REVEAL ANIMATION
// ================================

const reveals = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            if (entry.target.classList.contains('project-card')) {
                setTimeout(() => { entry.target.classList.add('active'); }, 100);
            }
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -100px 0px' });

reveals.forEach(reveal => revealObserver.observe(reveal));

// ================================
// SCROLL-TRIGGERED FADE-IN FOR PROJECT SECTIONS
// ================================

const projectSections = document.querySelectorAll('.project-section');

const projectObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
        }
    });
}, { threshold: 0.2, rootMargin: '0px 0px -100px 0px' });

projectSections.forEach(section => projectObserver.observe(section));

// ================================
// MERGED TRANSFORM PIPELINE
// project-split: tilt + scale via JS
// project-image: parallax translateY only via JS
// Shazam + Netflix hover zoom: CSS only (not JS)
// ================================

const splitState = new WeakMap();
const imageState = new WeakMap();

function lerp(start, end, amount) {
    return start + (end - start) * amount;
}

function initSplitState(card) {
    if (!splitState.has(card)) {
        splitState.set(card, { tiltX: 0, tiltY: 0, targetTiltX: 0, targetTiltY: 0, scale: 1 });
    }
}

function initImageState(image) {
    if (!imageState.has(image)) {
        imageState.set(image, { translateY: 0, targetTranslateY: 0 });
    }
}

function applySplitTransforms(card) {
    const s = splitState.get(card);
    card.style.transform = `perspective(1000px) rotateX(${s.tiltX}deg) rotateY(${s.tiltY}deg) scale(${s.scale})`;
}

// Only translateY — no scale applied to images via JS
function applyImageTransforms(image) {
    const s = imageState.get(image);
    image.style.transform = `translateY(${s.translateY}px)`;
}

const splitCards = document.querySelectorAll('.project-split');
splitCards.forEach(card => {
    initSplitState(card);
    const image = card.querySelector('.project-image');
    if (image) initImageState(image);
});

// ================================
// SCROLL-BASED PARALLAX ON PROJECT IMAGES
// ================================

let scrollNeedsUpdate = false;
window.addEventListener('scroll', () => { scrollNeedsUpdate = true; });

function updateScrollParallax() {
    if (!scrollNeedsUpdate) return;
    scrollNeedsUpdate = false;

    projectSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (rect.top < windowHeight && rect.bottom > 0) {
            const scrollProgress = (windowHeight - rect.top) / (windowHeight + rect.height);
            const parallaxAmount = (scrollProgress - 0.5) * 50;
            const image = section.querySelector('.project-image');
            if (image && imageState.has(image)) {
                imageState.get(image).targetTranslateY = parallaxAmount;
            }
        }
    });
}

// ================================
// MOUSE-BASED TILT WITH INERTIA
// ================================

splitCards.forEach(card => {
    const state = splitState.get(card);

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const rotateX = ((e.clientY - rect.top) / rect.height * 2 - 1) * -5;
        const rotateY = ((e.clientX - rect.left) / rect.width * 2 - 1) * 5;
        state.targetTiltX = rotateX;
        state.targetTiltY = rotateY;
    });

    card.addEventListener('mouseenter', () => { state.scale = 1.02; });
    card.addEventListener('mouseleave', () => {
        state.targetTiltX = 0;
        state.targetTiltY = 0;
        state.scale = 1;
    });
});

// ================================
// ANIMATION LOOP
// ================================

function animationLoop() {
    updateScrollParallax();

    splitCards.forEach(card => {
        const s = splitState.get(card);
        s.tiltX = lerp(s.tiltX, s.targetTiltX, 0.12);
        s.tiltY = lerp(s.tiltY, s.targetTiltY, 0.12);
        applySplitTransforms(card);
    });

    projectSections.forEach(section => {
        const image = section.querySelector('.project-image');
        if (image && imageState.has(image)) {
            const s = imageState.get(image);
            s.translateY = lerp(s.translateY, s.targetTranslateY, 0.12);
            applyImageTransforms(image);
        }
    });

    requestAnimationFrame(animationLoop);
}

requestAnimationFrame(animationLoop);

// ================================
// PARALLAX FOR .parallax CARDS (OLD)
// ================================

document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.parallax').forEach(card => {
        const rect = card.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        const distanceX = (e.clientX - cardCenterX) / 50;
        const distanceY = (e.clientY - cardCenterY) / 50;

        if (rect.top < window.innerHeight && rect.bottom > 0) {
            const mouseDistance = Math.sqrt(
                Math.pow(e.clientX - cardCenterX, 2) +
                Math.pow(e.clientY - cardCenterY, 2)
            );
            if (mouseDistance < 800) {
                card.style.transform = `perspective(1000px) rotateY(${distanceX * 0.3}deg) rotateX(${-distanceY * 0.3}deg)`;
                const image = card.querySelector('.project-image');
                const content = card.querySelector('.project-content');
                if (image) image.style.transform = `translateX(${distanceX * 0.5}px) translateY(${distanceY * 0.5}px)`;
                if (content) content.style.transform = `translateX(${distanceX * 0.2}px) translateY(${distanceY * 0.2}px)`;
            }
        }
    });
});

document.addEventListener('mouseleave', () => {
    document.querySelectorAll('.parallax').forEach(card => {
        card.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
        const image = card.querySelector('.project-image');
        const content = card.querySelector('.project-content');
        if (image) image.style.transform = 'translateX(0) translateY(0)';
        if (content) content.style.transform = 'translateX(0) translateY(0)';
    });
});

// ================================
// ANIMATED GRADIENT BACKGROUND SHAPES
// ================================

document.querySelectorAll('.shape').forEach((shape, index) => {
    setInterval(() => {
        shape.style.left = Math.random() * 100 + '%';
        shape.style.top = Math.random() * 100 + '%';
    }, 5000 + index * 1000);
});

// ================================
// MAGNETIC CURSOR EFFECT
// ================================

document.querySelectorAll('.project-link, .hero-cta, .cta-button').forEach(el => {
    el.style.position = el.style.position || 'relative';
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });
    el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0, 0)';
    });
});

// ================================
// CONSOLE MESSAGE
// ================================

console.log('%c👋 Hello! Welcome to my portfolio', 'color: #667eea; font-size: 20px; font-weight: bold;');
console.log('%c🎨 Built with passion for Adobe', 'color: #764ba2; font-size: 14px;');