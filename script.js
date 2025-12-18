(function() {
    'use strict';

    window.__app = window.__app || {};

    const utils = {
        debounce: function(func, wait) {
            let timeout;
            return function() {
                const context = this;
                const args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(context, args), wait);
            };
        },

        throttle: function(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        getHeaderHeight: function() {
            const header = document.querySelector('header');
            return header ? header.offsetHeight : 72;
        },

        isHomePage: function() {
            const path = window.location.pathname;
            return path === '/' || path === '/index.html' || path === '/index';
        }
    };

    const BurgerMenuModule = {
        init: function() {
            if (window.__app.burgerInit) return;
            window.__app.burgerInit = true;

            const toggler = document.querySelector('.navbar-toggler');
            const collapse = document.querySelector('.navbar-collapse');
            const navLinks = document.querySelectorAll('.nav-link');

            if (!toggler || !collapse) return;

            let isOpen = false;

            const openMenu = () => {
                isOpen = true;
                collapse.classList.add('show');
                toggler.setAttribute('aria-expanded', 'true');
                document.body.style.overflow = 'hidden';
            };

            const closeMenu = () => {
                isOpen = false;
                collapse.classList.remove('show');
                toggler.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            };

            toggler.addEventListener('click', (e) => {
                e.preventDefault();
                isOpen ? closeMenu() : openMenu();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && isOpen) closeMenu();
            });

            document.addEventListener('click', (e) => {
                if (isOpen && !collapse.contains(e.target) && !toggler.contains(e.target)) {
                    closeMenu();
                }
            });

            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (isOpen) closeMenu();
                });
            });

            window.addEventListener('resize', utils.debounce(() => {
                if (window.innerWidth >= 992 && isOpen) closeMenu();
            }, 250));
        }
    };

    const FormValidationModule = {
        patterns: {
            name: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
            email: /^[^s@]+@[^s@]+.[^s@]+$/,
            phone: /^[ds+-()]{10,20}$/,
            message: /^.{10,}$/
        },

        messages: {
            firstName: 'Bitte geben Sie einen gültigen Vornamen ein (2-50 Zeichen).',
            lastName: 'Bitte geben Sie einen gültigen Nachnamen ein (2-50 Zeichen).',
            email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
            phone: 'Bitte geben Sie eine gültige Telefonnummer ein (10-20 Zeichen).',
            message: 'Die Nachricht muss mindestens 10 Zeichen enthalten.',
            service: 'Bitte wählen Sie einen Service aus.',
            serviceInterest: 'Bitte wählen Sie einen Service aus.',
            project: 'Bitte wählen Sie ein Projekt aus.',
            privacy: 'Bitte akzeptieren Sie die Datenschutzerklärung.',
            privacyConsent: 'Bitte akzeptieren Sie die Datenschutzerklärung.'
        },

        init: function() {
            if (window.__app.formsInit) return;
            window.__app.formsInit = true;

            const forms = document.querySelectorAll('.needs-validation, .c-form');

            forms.forEach(form => {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    this.clearErrors(form);

                    const isValid = this.validateForm(form);

                    if (isValid) {
                        this.submitForm(form);
                    } else {
                        form.classList.add('was-validated');
                    }
                });

                const inputs = form.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    input.addEventListener('blur', () => {
                        this.validateField(input);
                    });

                    input.addEventListener('input', () => {
                        if (input.classList.contains('is-invalid')) {
                            this.validateField(input);
                        }
                    });
                });
            });
        },

        validateForm: function(form) {
            const fields = form.querySelectorAll('input, textarea, select');
            let isValid = true;

            fields.forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            return isValid;
        },

        validateField: function(field) {
            const name = field.name || field.id;
            const value = field.value.trim();
            const type = field.type;
            const required = field.hasAttribute('required');

            if (!required && !value) {
                this.markValid(field);
                return true;
            }

            if (required && !value) {
                this.markInvalid(field, 'Dieses Feld ist erforderlich.');
                return false;
            }

            if (type === 'checkbox') {
                if (required && !field.checked) {
                    this.markInvalid(field, this.messages[name] || 'Bitte aktivieren Sie dieses Kontrollkästchen.');
                    return false;
                }
                this.markValid(field);
                return true;
            }

            if (type === 'email' || name === 'email') {
                if (!this.patterns.email.test(value)) {
                    this.markInvalid(field, this.messages.email);
                    return false;
                }
            }

            if (type === 'tel' || name === 'phone') {
                if (value && !this.patterns.phone.test(value)) {
                    this.markInvalid(field, this.messages.phone);
                    return false;
                }
            }

            if (name === 'firstName' || name === 'lastName') {
                if (!this.patterns.name.test(value)) {
                    this.markInvalid(field, this.messages[name]);
                    return false;
                }
            }

            if (field.tagName === 'TEXTAREA' || name === 'message') {
                if (value && !this.patterns.message.test(value)) {
                    this.markInvalid(field, this.messages.message);
                    return false;
                }
            }

            if (field.tagName === 'SELECT') {
                if (required && (!value || value === '')) {
                    this.markInvalid(field, this.messages[name] || 'Bitte wählen Sie eine Option.');
                    return false;
                }
            }

            this.markValid(field);
            return true;
        },

        markInvalid: function(field, message) {
            field.classList.add('is-invalid');
            field.classList.remove('is-valid');

            let feedback = field.parentElement.querySelector('.invalid-feedback');
            if (!feedback) {
                feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                field.parentElement.appendChild(feedback);
            }
            feedback.textContent = message;
            feedback.style.display = 'block';
        },

        markValid: function(field) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');

            const feedback = field.parentElement.querySelector('.invalid-feedback');
            if (feedback) {
                feedback.style.display = 'none';
            }
        },

        clearErrors: function(form) {
            const invalidFields = form.querySelectorAll('.is-invalid');
            invalidFields.forEach(field => {
                field.classList.remove('is-invalid');
            });

            const feedbacks = form.querySelectorAll('.invalid-feedback');
            feedbacks.forEach(feedback => {
                feedback.style.display = 'none';
            });
        },

        submitForm: function(form) {
            const submitBtn = form.querySelector('[type="submit"]');
            
            if (submitBtn) {
                submitBtn.disabled = true;
                const originalText = submitBtn.textContent;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Wird gesendet...';

                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    form.reset();
                    form.classList.remove('was-validated');
                    
                    const validFields = form.querySelectorAll('.is-valid');
                    validFields.forEach(field => field.classList.remove('is-valid'));

                    window.location.href = '/thank_you.html';
                }, 1500);
            }
        }
    };

    const SmoothScrollModule = {
        init: function() {
            if (window.__app.smoothScrollInit) return;
            window.__app.smoothScrollInit = true;

            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="#"]');
                if (!link) return;

                const href = link.getAttribute('href');
                if (href === '#' || href === '#!') return;

                const targetId = href.substring(1);
                const target = document.getElementById(targetId);
                
                if (!target) return;

                e.preventDefault();

                const headerHeight = utils.getHeaderHeight();
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            });
        }
    };

    const ScrollSpyModule = {
        init: function() {
            if (window.__app.scrollSpyInit) return;
            window.__app.scrollSpyInit = true;

            const sections = document.querySelectorAll('section[id]');
            const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

            if (sections.length === 0 || navLinks.length === 0) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        navLinks.forEach(link => {
                            link.classList.remove('active');
                            link.removeAttribute('aria-current');
                            
                            if (link.getAttribute('href') === `#${id}`) {
                                link.classList.add('active');
                                link.setAttribute('aria-current', 'page');
                            }
                        });
                    }
                });
            }, {
                rootMargin: '-100px 0px -66%'
            });

            sections.forEach(section => observer.observe(section));
        }
    };

    const ScrollAnimationModule = {
        init: function() {
            if (window.__app.scrollAnimInit) return;
            window.__app.scrollAnimInit = true;

            const animatedElements = document.querySelectorAll('.card, .btn, img, h1, h2, h3, p');

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            animatedElements.forEach((el, index) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = `opacity 0.6s ease-out ${index * 0.05}s, transform 0.6s ease-out ${index * 0.05}s`;
                observer.observe(el);
            });
        }
    };

    const MicroInteractionsModule = {
        init: function() {
            if (window.__app.microInit) return;
            window.__app.microInit = true;

            const buttons = document.querySelectorAll('.btn, .c-button, button');
            
            buttons.forEach(btn => {
                btn.addEventListener('mouseenter', function() {
                    this.style.transition = 'transform 0.2s ease-out, box-shadow 0.2s ease-out';
                });

                btn.addEventListener('click', function(e) {
                    const ripple = document.createElement('span');
                    const rect = this.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    const x = e.clientX - rect.left - size / 2;
                    const y = e.clientY - rect.top - size / 2;

                    ripple.style.width = ripple.style.height = size + 'px';
                    ripple.style.left = x + 'px';
                    ripple.style.top = y + 'px';
                    ripple.style.position = 'absolute';
                    ripple.style.borderRadius = '50%';
                    ripple.style.background = 'rgba(255, 255, 255, 0.5)';
                    ripple.style.pointerEvents = 'none';
                    ripple.style.transform = 'scale(0)';
                    ripple.style.animation = 'ripple 0.6s ease-out';

                    this.style.position = 'relative';
                    this.style.overflow = 'hidden';
                    this.appendChild(ripple);

                    setTimeout(() => ripple.remove(), 600);
                });
            });

            const style = document.createElement('style');
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };

    const CountUpModule = {
        init: function() {
            if (window.__app.countUpInit) return;
            window.__app.countUpInit = true;

            const counters = document.querySelectorAll('[data-count]');
            if (counters.length === 0) return;

            const animateCount = (element) => {
                const target = parseInt(element.getAttribute('data-count'));
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;

                const timer = setInterval(() => {
                    current += step;
                    if (current >= target) {
                        element.textContent = target;
                        clearInterval(timer);
                    } else {
                        element.textContent = Math.floor(current);
                    }
                }, 16);
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCount(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            counters.forEach(counter => observer.observe(counter));
        }
    };

    const PortfolioFilterModule = {
        init: function() {
            if (window.__app.portfolioFilterInit) return;
            window.__app.portfolioFilterInit = true;

            const filters = document.querySelectorAll('.portfolio-filter');
            const items = document.querySelectorAll('.portfolio-item');

            if (filters.length === 0 || items.length === 0) return;

            filters.forEach(filter => {
                filter.addEventListener('click', function() {
                    const category = this.getAttribute('data-filter');

                    filters.forEach(f => f.classList.remove('active'));
                    this.classList.add('active');

                    items.forEach(item => {
                        const itemCategory = item.getAttribute('data-category');
                        
                        if (category === 'all' || itemCategory === category) {
                            item.style.display = 'block';
                            item.style.animation = 'fadeIn 0.5s ease-out';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                });
            });

            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };

    const ModalModule = {
        init: function() {
            if (window.__app.modalInit) return;
            window.__app.modalInit = true;

            const modalTriggers = document.querySelectorAll('[data-bs-toggle="modal"]');
            
            modalTriggers.forEach(trigger => {
                trigger.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('data-bs-target');
                    const modal = document.querySelector(targetId);
                    
                    if (modal) {
                        modal.classList.add('show');
                        modal.style.display = 'flex';
                        document.body.style.overflow = 'hidden';
                    }
                });
            });

            const closeButtons = document.querySelectorAll('[data-bs-dismiss="modal"]');
            
            closeButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const modal = this.closest('.modal');
                    if (modal) {
                        modal.classList.remove('show');
                        modal.style.display = 'none';
                        document.body.style.overflow = '';
                    }
                });
            });

            document.addEventListener('click', function(e) {
                if (e.target.classList.contains('modal')) {
                    e.target.classList.remove('show');
                    e.target.style.display = 'none';
                    document.body.style.overflow = '';
                }
            });
        }
    };

    const ScrollToTopModule = {
        init: function() {
            if (window.__app.scrollTopInit) return;
            window.__app.scrollTopInit = true;

            const scrollBtn = document.createElement('button');
            scrollBtn.innerHTML = '↑';
            scrollBtn.className = 'scroll-to-top';
            scrollBtn.setAttribute('aria-label', 'Nach oben scrollen');
            document.body.appendChild(scrollBtn);

            const style = document.createElement('style');
            style.textContent = `
                .scroll-to-top {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
                    color: white;
                    border: none;
                    border-radius: 50%;
                    font-size: 24px;
                    cursor: pointer;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease-out;
                    box-shadow: var(--shadow-lg);
                    z-index: 999;
                }
                .scroll-to-top.visible {
                    opacity: 1;
                    visibility: visible;
                }
                .scroll-to-top:hover {
                    transform: translateY(-5px);
                    box-shadow: var(--shadow-xl);
                }
            `;
            document.head.appendChild(style);

            window.addEventListener('scroll', utils.throttle(() => {
                if (window.pageYOffset > 300) {
                    scrollBtn.classList.add('visible');
                } else {
                    scrollBtn.classList.remove('visible');
                }
            }, 100));

            scrollBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    };

    const ImageLazyLoadModule = {
        init: function() {
            if (window.__app.imageInit) return;
            window.__app.imageInit = true;

            const images = document.querySelectorAll('img:not([loading])');
            const videos = document.querySelectorAll('video:not([loading])');

            images.forEach(img => {
                if (!img.hasAttribute('loading')) {
                    img.setAttribute('loading', 'lazy');
                }
            });

            videos.forEach(video => {
                if (!video.hasAttribute('loading')) {
                    video.setAttribute('loading', 'lazy');
                }
            });
        }
    };

    const ActiveMenuModule = {
        init: function() {
            if (window.__app.activeMenuInit) return;
            window.__app.activeMenuInit = true;

            const navLinks = document.querySelectorAll('.nav-link');
            const currentPath = window.location.pathname;

            navLinks.forEach(link => {
                link.classList.remove('active');
                link.removeAttribute('aria-current');

                const href = link.getAttribute('href');

                if ((href === '/' || href === '/index.html') && (currentPath === '/' || currentPath === '/index.html')) {
                    link.classList.add('active');
                    link.setAttribute('aria-current', 'page');
                } else if (href !== '/' && currentPath.includes(href)) {
                    link.classList.add('active');
                    link.setAttribute('aria-current', 'page');
                }
            });
        }
    };

    const PrivacyPolicyModule = {
        init: function() {
            if (window.__app.privacyInit) return;
            window.__app.privacyInit = true;

            const privacyLinks = document.querySelectorAll('a[href*="privacy"]');
            
            privacyLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    if (this.getAttribute('href') === '#privacy' || this.getAttribute('href') === '#!') {
                        e.preventDefault();
                        window.location.href = '/privacy.html';
                    }
                });
            });
        }
    };

    window.__app.init = function() {
        BurgerMenuModule.init();
        FormValidationModule.init();
        SmoothScrollModule.init();
        ScrollSpyModule.init();
        ScrollAnimationModule.init();
        MicroInteractionsModule.init();
        CountUpModule.init();
        PortfolioFilterModule.init();
        ModalModule.init();
        ScrollToTopModule.init();
        ImageLazyLoadModule.init();
        ActiveMenuModule.init();
        PrivacyPolicyModule.init();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.__app.init);
    } else {
        window.__app.init();
    }

})();
