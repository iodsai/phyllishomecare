/**
 * PHYLLIS HOME CARE - Main JavaScript
 * Hardened for high-traffic scenarios
 * - Rate limiting on form submissions
 * - Debounced event handlers
 * - Error boundaries
 * - Memory leak prevention
 */

(function() {
    'use strict';
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    // Debounce function to limit rapid calls
    function debounce(func, wait) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }
    
    // Throttle function for scroll events
    function throttle(func, limit) {
        var inThrottle;
        return function() {
            var context = this, args = arguments;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(function() { inThrottle = false; }, limit);
            }
        };
    }
    
    // Rate limiter for form submissions
    var RateLimiter = {
        submissions: {},
        maxSubmissions: 3,
        windowMs: 60000, // 1 minute
        
        canSubmit: function(formId) {
            var now = Date.now();
            if (!this.submissions[formId]) {
                this.submissions[formId] = [];
            }
            // Clean old entries
            this.submissions[formId] = this.submissions[formId].filter(function(time) {
                return now - time < this.windowMs;
            }.bind(this));
            
            if (this.submissions[formId].length >= this.maxSubmissions) {
                return false;
            }
            this.submissions[formId].push(now);
            return true;
        }
    };
    
    // Safe DOM query
    function $(selector, context) {
        try {
            return (context || document).querySelector(selector);
        } catch (e) {
            return null;
        }
    }
    
    function $$(selector, context) {
        try {
            return Array.prototype.slice.call((context || document).querySelectorAll(selector));
        } catch (e) {
            return [];
        }
    }
    
    // Safe event listener
    function on(element, event, handler, options) {
        if (element && typeof element.addEventListener === 'function') {
            element.addEventListener(event, handler, options || false);
            return function() {
                element.removeEventListener(event, handler, options || false);
            };
        }
        return function() {};
    }
    
    // ============================================
    // FORM HELPERS
    // ============================================
    
    function showFormError(form, message) {
        var error = $('.form-error', form);
        if (error) {
            error.textContent = message || '';
            error.style.display = message ? 'block' : 'none';
        }
    }
    
    function showFormSuccess(form, message) {
        var success = $('.form-success-inline', form);
        if (success) {
            success.textContent = message || '';
            success.style.display = message ? 'block' : 'none';
        }
    }
    
    function validateEmail(email) {
        if (!email) return true; // Optional field
        var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function validatePhone(phone) {
        if (!phone) return false;
        var digits = phone.replace(/\D/g, '');
        return digits.length >= 10;
    }
    
    function sanitizeInput(str) {
        if (!str) return '';
        return str.replace(/<[^>]*>/g, '').trim().substring(0, 2000);
    }
    
    // ============================================
    // MAIN INITIALIZATION
    // ============================================
    
    function init() {
        initNavigation();
        initScrollEffects();
        initForms();
        initCookieNotice();
        initChat();
        initPhoneFormatting();
    }
    
    // ============================================
    // NAVIGATION
    // ============================================
    
    function initNavigation() {
        var navToggle = $('#nav-toggle');
        var navMenu = $('#nav-menu');
        var header = $('#header');
        
        if (navToggle && navMenu) {
            on(navToggle, 'click', function() {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
                var expanded = navToggle.getAttribute('aria-expanded') === 'true';
                navToggle.setAttribute('aria-expanded', !expanded);
            });
            
            // Close menu on link click
            $$('.nav__link', navMenu).forEach(function(link) {
                on(link, 'click', function() {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                    navToggle.setAttribute('aria-expanded', 'false');
                });
            });
            
            // Close menu on outside click
            on(document, 'click', function(e) {
                if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
        
        // Smooth scroll for anchor links
        $$('a[href^="#"]').forEach(function(anchor) {
            on(anchor, 'click', function(e) {
                var targetId = this.getAttribute('href');
                if (targetId && targetId !== '#') {
                    var target = $(targetId);
                    if (target) {
                        e.preventDefault();
                        var headerHeight = header ? header.offsetHeight : 0;
                        var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    }
    
    // ============================================
    // SCROLL EFFECTS
    // ============================================
    
    function initScrollEffects() {
        var header = $('#header');
        
        if (header) {
            var handleScroll = throttle(function() {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            }, 100);
            
            on(window, 'scroll', handleScroll, { passive: true });
        }
        
        // Fade in animations with IntersectionObserver
        if ('IntersectionObserver' in window) {
            var fadeElements = $$('.fade-in');
            if (fadeElements.length > 0) {
                var fadeObserver = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                            fadeObserver.unobserve(entry.target);
                        }
                    });
                }, {
                    threshold: 0.1,
                    rootMargin: '0px 0px -50px 0px'
                });
                
                fadeElements.forEach(function(el) {
                    fadeObserver.observe(el);
                });
            }
        }
    }
    
    // ============================================
    // FORMS
    // ============================================
    
    function initForms() {
        // Contact Form
        var contactForm = $('#contact-form');
        if (contactForm) {
            initContactForm(contactForm);
        }
        
        // Careers Form
        var careersForm = $('#careers-form');
        if (careersForm) {
            initCareersForm(careersForm);
        }
    }
    
    function initContactForm(form) {
        var isSubmitting = false;
        var formLoadTime = Date.now();
        var MIN_FILL_TIME = 3000; // Minimum 3 seconds to fill form (bots are instant)
        
        on(form, 'submit', function(e) {
            e.preventDefault();
            
            // Prevent double submission
            if (isSubmitting) return;
            
            // Rate limiting
            if (!RateLimiter.canSubmit('contact-form')) {
                showFormError(form, 'Too many submissions. Please wait a moment before trying again.');
                return;
            }
            
            var formData = new FormData(form);
            var data = {};
            formData.forEach(function(value, key) {
                data[key] = sanitizeInput(value);
            });
            
            showFormError(form, '');
            showFormSuccess(form, '');
            
            // Validation
            if (!data.name || data.name.length < 2) {
                showFormError(form, 'Please enter your name.');
                return;
            }
            
            if (!validatePhone(data.phone)) {
                showFormError(form, 'Please enter a valid phone number.');
                return;
            }
            
            if (data.email && !validateEmail(data.email)) {
                showFormError(form, 'Please enter a valid email address.');
                return;
            }
            
            var consentBox = $('input[name="consent"]', form);
            if (consentBox && !consentBox.checked) {
                showFormError(form, 'Please check the consent box.');
                return;
            }
            
            // Honeypot check
            var honeypot = $('input[name="_gotcha"]', form);
            if (honeypot && honeypot.value) {
                // Bot detected, silently fail
                showFormSuccess(form, 'Message sent! We will call you shortly.');
                form.reset();
                return;
            }
            
            // Time-based bot check (bots fill forms instantly)
            var fillTime = Date.now() - formLoadTime;
            if (fillTime < MIN_FILL_TIME) {
                // Too fast, likely a bot - silently fail
                showFormSuccess(form, 'Message sent! We will call you shortly.');
                form.reset();
                return;
            }
            
            var submitBtn = $('button[type="submit"]', form);
            var originalText = submitBtn ? submitBtn.innerHTML : '';
            
            if (submitBtn) {
                submitBtn.innerHTML = 'Sending...';
                submitBtn.disabled = true;
            }
            
            isSubmitting = true;
            
            var formAction = form.getAttribute('action') || 'https://formspree.io/f/maqyvorl';
            
            // Create clean FormData
            var cleanFormData = new FormData();
            for (var key in data) {
                if (data.hasOwnProperty(key) && key !== '_gotcha') {
                    cleanFormData.append(key, data[key]);
                }
            }
            
            fetch(formAction, {
                method: 'POST',
                body: cleanFormData,
                headers: { 'Accept': 'application/json' }
            })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(function() {
                form.reset();
                showFormSuccess(form, 'Message sent! We will call you shortly.');
            })
            .catch(function(err) {
                console.error('Form submission error:', err);
                showFormError(form, 'Something went wrong. Please call us at (302) 446-3986.');
            })
            .finally(function() {
                isSubmitting = false;
                if (submitBtn) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        });
    }
    
    function initCareersForm(form) {
        var isSubmitting = false;
        var formLoadTime = Date.now();
        var MIN_FILL_TIME = 5000; // Minimum 5 seconds for careers form (longer form)
        
        on(form, 'submit', function(e) {
            e.preventDefault();
            
            if (isSubmitting) return;
            
            if (!RateLimiter.canSubmit('careers-form')) {
                showFormError(form, 'Too many submissions. Please wait a moment before trying again.');
                return;
            }
            
            var formData = new FormData(form);
            var data = {};
            formData.forEach(function(value, key) {
                data[key] = sanitizeInput(value);
            });
            
            showFormError(form, '');
            showFormSuccess(form, '');
            
            // Validation
            if (!data.firstName || !data.lastName) {
                showFormError(form, 'Please enter your full name.');
                return;
            }
            
            if (!validatePhone(data.phone)) {
                showFormError(form, 'Please enter a valid phone number.');
                return;
            }
            
            if (!validateEmail(data.email)) {
                showFormError(form, 'Please enter a valid email address.');
                return;
            }
            
            var consentBox = $('input[name="consent"]', form);
            if (consentBox && !consentBox.checked) {
                showFormError(form, 'Please check the consent box.');
                return;
            }
            
            // Honeypot check
            var honeypot = $('input[name="_gotcha"]', form);
            if (honeypot && honeypot.value) {
                showFormSuccess(form, 'Application submitted! We will be in touch soon.');
                form.reset();
                return;
            }
            
            // Time-based bot check
            var fillTime = Date.now() - formLoadTime;
            if (fillTime < MIN_FILL_TIME) {
                showFormSuccess(form, 'Application submitted! We will be in touch soon.');
                form.reset();
                return;
            }
            
            var submitBtn = $('button[type="submit"]', form);
            var originalText = submitBtn ? submitBtn.innerHTML : '';
            
            if (submitBtn) {
                submitBtn.innerHTML = 'Submitting...';
                submitBtn.disabled = true;
            }
            
            isSubmitting = true;
            
            var formAction = form.getAttribute('action') || 'https://formspree.io/f/maqyvorl';
            
            var cleanFormData = new FormData();
            for (var key in data) {
                if (data.hasOwnProperty(key) && key !== '_gotcha') {
                    cleanFormData.append(key, data[key]);
                }
            }
            
            fetch(formAction, {
                method: 'POST',
                body: cleanFormData,
                headers: { 'Accept': 'application/json' }
            })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(function() {
                form.reset();
                showFormSuccess(form, 'Application submitted! We will contact you within 1 business day.');
            })
            .catch(function(err) {
                console.error('Form submission error:', err);
                showFormError(form, 'Something went wrong. Please call us at (302) 446-3986.');
            })
            .finally(function() {
                isSubmitting = false;
                if (submitBtn) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        });
    }
    
    // ============================================
    // PHONE FORMATTING
    // ============================================
    
    function initPhoneFormatting() {
        var phoneInputs = $$('input[type="tel"]');
        
        phoneInputs.forEach(function(input) {
            on(input, 'input', debounce(function(e) {
                var value = e.target.value.replace(/\D/g, '');
                if (value.length > 0) {
                    if (value.length <= 3) {
                        value = '(' + value;
                    } else if (value.length <= 6) {
                        value = '(' + value.slice(0, 3) + ') ' + value.slice(3);
                    } else {
                        value = '(' + value.slice(0, 3) + ') ' + value.slice(3, 6) + '-' + value.slice(6, 10);
                    }
                }
                e.target.value = value;
            }, 50));
        });
    }
    
    // ============================================
    // COOKIE NOTICE
    // ============================================
    
    function initCookieNotice() {
        var cookieBanner = $('#cookie-notice');
        if (!cookieBanner) return;
        
        try {
            if (localStorage.getItem('cookieDismissed') === 'true') {
                cookieBanner.style.display = 'none';
                return;
            }
        } catch (e) {
            // localStorage not available
        }
        
        var dismissBtn = $('[data-cookie-dismiss]', cookieBanner);
        if (dismissBtn) {
            on(dismissBtn, 'click', function() {
                cookieBanner.classList.add('hide');
                try {
                    localStorage.setItem('cookieDismissed', 'true');
                } catch (e) {}
                setTimeout(function() {
                    cookieBanner.style.display = 'none';
                }, 300);
            });
        }
    }
    
    // ============================================
    // CHAT WIDGET
    // ============================================
    
    function initChat() {
        if (document.body.dataset.disableChat) return;
        
        var endpointMeta = $('meta[name="chat-endpoint"]');
        var CHAT_ENDPOINT = endpointMeta ? endpointMeta.getAttribute('content') : '';
        
        var launcher = $('#chat-launcher');
        var panel = $('#chat-panel');
        var closeBtn = $('#chat-close');
        var textarea = $('#chat-input');
        var feed = $('#chat-messages');
        var sendBtn = $('#chat-send');
        var statusEl = $('#chat-status');
        
        if (!launcher || !panel) return;
        
        var isChatting = false;
        
        function appendMessage(text, role) {
            if (!feed) return;
            var div = document.createElement('div');
            div.className = 'chat-bubble chat-bubble--' + (role === 'user' ? 'user' : 'bot');
            div.textContent = sanitizeInput(text);
            feed.appendChild(div);
            feed.scrollTop = feed.scrollHeight;
        }
        
        function setStatus(text) {
            if (statusEl) statusEl.textContent = text || '';
        }
        
        function togglePanel(open) {
            if (open) {
                panel.classList.add('chat-panel--open');
                panel.setAttribute('aria-hidden', 'false');
                launcher.setAttribute('aria-expanded', 'true');
                if (textarea) textarea.focus();
            } else {
                panel.classList.remove('chat-panel--open');
                panel.setAttribute('aria-hidden', 'true');
                launcher.setAttribute('aria-expanded', 'false');
            }
        }
        
        on(launcher, 'click', function() {
            togglePanel(!panel.classList.contains('chat-panel--open'));
        });
        
        function clearChat() {
            if (feed) {
                while (feed.firstChild) {
                    feed.removeChild(feed.firstChild);
                }
            }
        }
        
        on(closeBtn, 'click', function() {
            togglePanel(false);
            clearChat();
        });
        
        // Close on Escape
        on(document, 'keydown', function(e) {
            if (e.key === 'Escape' && panel.classList.contains('chat-panel--open')) {
                togglePanel(false);
                clearChat();
            }
        });
        
        function sendMessage() {
            if (!textarea || isChatting) return;
            
            var message = sanitizeInput(textarea.value);
            if (!message) return;
            
            appendMessage(message, 'user');
            textarea.value = '';
            setStatus('Sending...');
            isChatting = true;
            
            if (!CHAT_ENDPOINT || CHAT_ENDPOINT === '__CHAT_ENDPOINT__') {
                appendMessage('Chat is setting up. Please call (302) 446-3986 or use the care form.', 'bot');
                setStatus('');
                isChatting = false;
                return;
            }
            
            fetch(CHAT_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                appendMessage(data.reply || 'Thanks for reaching out. Please call (302) 446-3986.', 'bot');
            })
            .catch(function() {
                appendMessage('Thanks for reaching out. Please call (302) 446-3986 or use the care request form.', 'bot');
            })
            .finally(function() {
                setStatus('');
                isChatting = false;
            });
        }
        
        if (sendBtn) {
            on(sendBtn, 'click', sendMessage);
        }
        
        if (textarea) {
            on(textarea, 'keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }
    }
    
    // ============================================
    // START
    // ============================================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
