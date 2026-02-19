/**
 * Smooth Scroll with Soft Inertia
 * + Scroll Reveal (subtle, reading-focused)
 * Focused on reading experience, not interface scrolling
 */

(function () {
    'use strict';

    // Configuration
    const config = {
        // Easing function - cubic bezier for natural deceleration
        easing: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
        // Duration for anchor scroll (in ms)
        scrollDuration: 900,
        // Offset from top when scrolling to sections (header height)
        scrollOffset: 80,
        // Reveal threshold - how much of element must be visible
        revealThreshold: 0.15
    };

    // Smooth scroll to anchor links
    function initAnchorScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');

                // Skip if it's just "#" or empty
                if (targetId === '#' || !targetId) return;

                const targetElement = document.querySelector(targetId);
                if (!targetElement) return;

                e.preventDefault();

                const startPosition = window.pageYOffset;
                const targetPosition = targetElement.getBoundingClientRect().top + startPosition - config.scrollOffset;
                const distance = targetPosition - startPosition;
                let startTime = null;

                function animation(currentTime) {
                    if (startTime === null) startTime = currentTime;
                    const timeElapsed = currentTime - startTime;
                    const progress = Math.min(timeElapsed / config.scrollDuration, 1);

                    window.scrollTo(0, startPosition + (distance * config.easing(progress)));

                    if (progress < 1) {
                        requestAnimationFrame(animation);
                    }
                }

                requestAnimationFrame(animation);
            });
        });
    }

    // Scroll reveal - subtle, triggers once
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.reveal');

        if (!revealElements.length) return;

        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            revealElements.forEach(el => el.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Unobserve after reveal - triggers only once
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: config.revealThreshold,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => observer.observe(el));
    }

    // Active navigation - subtle scroll-based highlighting
    function initActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.header__nav-link');

        if (!sections.length || !navLinks.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');

                    // Remove active class from all links
                    navLinks.forEach(link => link.classList.remove('is-active'));

                    // Add active class to matching link
                    const activeLink = document.querySelector(`.header__nav-link[href="#${id}"]`);
                    if (activeLink) {
                        activeLink.classList.add('is-active');
                    }
                }
            });
        }, {
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        });

        sections.forEach(section => observer.observe(section));
    }

    // Ornament slow drift - deep visual layer
    // Ornament subtle movement (slower than sections for depth)
    function initOrnamentDrift() {
        const ornaments = document.querySelectorAll('.ornament');
        if (ornaments.length === 0) return;

        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        // Ornaments move at 70% of scroll speed (slower than sections at 85%)
        const scrollSpeedFactor = 0.7;
        const driftFactor = 0.05;
        let currentY = 0;
        let targetY = 0;
        let rafId = null;

        function updatePosition() {
            // Smooth interpolation for gradual movement
            currentY += (targetY - currentY) * 0.03;

            // Apply transform to all ornaments
            if (Math.abs(targetY - currentY) > 0.1) {
                ornaments.forEach(ornament => {
                    ornament.style.transform = `translateY(calc(-50% + ${currentY}px))`;
                });
                rafId = requestAnimationFrame(updatePosition);
            } else {
                rafId = null;
            }
        }

        window.addEventListener('scroll', () => {
            // Slower scroll movement (70% speed creates depth)
            targetY = window.pageYOffset * (1 - scrollSpeedFactor) * 0.2;

            if (!rafId) {
                rafId = requestAnimationFrame(updatePosition);
            }
        }, { passive: true });
    }

    // Progressive disclosure - ZONA.MEDIA STYLE "Загрузить ещё"
    function initProgressiveDisclosure() {
        const showMoreBtn = document.getElementById('showMoreBtn');
        const publicationsList = document.querySelector('#media .publications__list');

        if (!showMoreBtn || !publicationsList || typeof REMAINING_ARTICLES === 'undefined') return;

        let currentIndex = 0;
        const articlesPerLoad = 5;

        function loadMoreArticles() {
            // Берем следующие 5 статей из массива
            const articlesToAdd = REMAINING_ARTICLES.slice(currentIndex, currentIndex + articlesPerLoad);

            if (articlesToAdd.length === 0) {
                showMoreBtn.remove();
                return;
            }

            // Создаем и добавляем HTML для каждой статьи
            articlesToAdd.forEach((article, index) => {
                const li = document.createElement('li');
                li.className = 'publication reveal is-visible';

                const a = document.createElement('a');
                a.href = article.url;
                a.className = 'publication__link';
                a.target = '_blank';
                a.textContent = article.title;

                li.appendChild(a);
                publicationsList.appendChild(li);
            });

            currentIndex += articlesPerLoad;

            // Обновить текст кнопки или скрыть её
            const remaining = REMAINING_ARTICLES.length - currentIndex;
            if (remaining <= 0) {
                showMoreBtn.remove();
            } else {
                const toShow = Math.min(articlesPerLoad, remaining);
                showMoreBtn.textContent = `Show ${toShow} more interview${toShow > 1 ? 's' : ''}`;
            }
        }

        showMoreBtn.addEventListener('click', loadMoreArticles);
    }

    // Subtle parallax effect for contact section
    function initContactParallax() {
        const contactLinks = document.querySelector('.contact__links');
        if (!contactLinks) return;

        let ticking = false;

        function updateParallax() {
            const rect = contactLinks.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Only apply when section is in viewport
            if (rect.top < windowHeight && rect.bottom > 0) {
                // Calculate scroll progress through viewport (0 to 1)
                const progress = 1 - (rect.top / windowHeight);
                // Subtle movement: -20px to 0px (increased by 30%)
                const translateY = Math.max(-20, -20 + (progress * 20));
                contactLinks.style.transform = `translateY(${translateY}px)`;
            }

            ticking = false;
        }

        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        updateParallax(); // Initial position
    }

    // Section-based scroll inertia parallax
    function initSectionInertia() {
        const sections = document.querySelectorAll('.hero, .section');
        if (sections.length === 0) return;

        const speedFactor = 0.85; // Sections move at 85% of scroll speed (more visible lag)
        const maxOffset = 45; // Maximum 45px movement (visually noticeable)
        let ticking = false;

        function updateInertia() {
            const scrollY = window.scrollY;

            sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                const sectionTop = scrollY + rect.top;
                const sectionHeight = rect.height;
                const viewportHeight = window.innerHeight;

                // Only apply when section is in or near viewport
                if (scrollY + viewportHeight > sectionTop - 200 &&
                    scrollY < sectionTop + sectionHeight + 200) {

                    // Calculate offset: difference between scroll and section position
                    const offset = (scrollY - sectionTop) * (1 - speedFactor);

                    // Clamp to max offset
                    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, offset));

                    section.style.transform = `translateY(${clampedOffset}px)`;
                } else {
                    // Reset transform when far from viewport
                    section.style.transform = 'translateY(0)';
                }
            });

            ticking = false;
        }

        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(updateInertia);
                ticking = true;
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        updateInertia(); // Set initial state
    }

    // Initialize when DOM is ready
    function init() {
        initAnchorScroll();
        initScrollReveal();
        initActiveNav();
        initOrnamentDrift();
        initProgressiveDisclosure();
        initContactParallax();
        initSectionInertia();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
