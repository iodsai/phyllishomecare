/**
 * PHYLLIS HOME CARE - Main JavaScript
 * Handles navigation, forms, and interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Chat widget (skip if disabled on this page)
    if (!document.body.dataset.disableChat) {
        const endpointMeta = document.querySelector('meta[name="chat-endpoint"]');
        const CHAT_ENDPOINT = endpointMeta?.content || '';
        const launcher = document.getElementById('chat-launcher');
        const panel = document.getElementById('chat-panel');
        const closeBtn = document.getElementById('chat-close');
        const form = document.getElementById('chat-form');
        const textarea = document.getElementById('chat-input');
        const feed = document.getElementById('chat-messages');
        const statusEl = document.getElementById('chat-status');

        const appendMessage = (text, role = 'bot') => {
            if (!feed) return;
            const div = document.createElement('div');
            div.className = `chat-bubble chat-bubble--${role === 'user' ? 'user' : 'bot'}`;
            div.textContent = text;
            feed.appendChild(div);
            feed.scrollTop = feed.scrollHeight;
        };

        const setStatus = (text) => { if (statusEl) statusEl.textContent = text; };

        const togglePanel = (open) => {
            if (!panel || !launcher) return;
            if (open) {
                panel.classList.add('chat-panel--open');
                launcher.setAttribute('aria-expanded', 'true');
            } else {
                panel.classList.remove('chat-panel--open');
                launcher.setAttribute('aria-expanded', 'false');
            }
        };

        if (launcher && panel) {
            launcher.addEventListener('click', () => togglePanel(!panel.classList.contains('chat-panel--open')));
        }
        if (closeBtn) closeBtn.addEventListener('click', () => togglePanel(false));

        if (form && textarea && feed) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const message = textarea.value.trim();
                if (!message) return;
                appendMessage(message, 'user');
                textarea.value = '';
                setStatus('Sending...');

                if (!CHAT_ENDPOINT) {
                    appendMessage('Chat is setting up. Please call (302) 446-3986 or use the care form.', 'bot');
                    setStatus('');
                    return;
                }

                try {
                    const res = await fetch(CHAT_ENDPOINT, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message })
                    });
                    const data = await res.json();
                    appendMessage(data.reply || 'Thanks for reaching out. Please call (302) 446-3986.', 'bot');
                } catch (err) {
                    appendMessage('Thanks for reaching out. Our chat is currently in setup. Please call (302) 446-3986 or use the care request form and we’ll respond quickly.', 'bot');
                } finally {
                    setStatus('');
                }
            });
        }
    }

    // Cookie notice persistence
    const cookieBanner = document.getElementById('cookie-notice');
    if (cookieBanner) {
        const closeBtn = cookieBanner.querySelector('[data-cookie-dismiss]');
        if (localStorage.getItem('cookieDismissed') === 'true') {
            cookieBanner.style.display = 'none';
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                cookieBanner.classList.add('hide');
                localStorage.setItem('cookieDismissed', 'true');
                setTimeout(() => {
                    cookieBanner.style.display = 'none';
                }, 300);
            });
        }
    }
    
    // Mobile Navigation Toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        
        // Close menu when clicking a link
        const navLinks = navMenu.querySelectorAll('.nav__link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
    
    // Header scroll effect
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId !== '#') {
                e.preventDefault();
                const target = document.querySelector(targetId);
                if (target) {
                    const headerHeight = header ? header.offsetHeight : 0;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Fade in animations on scroll
    const fadeElements = document.querySelectorAll('.fade-in');
    if (fadeElements.length > 0) {
        const fadeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    fadeObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        fadeElements.forEach(el => fadeObserver.observe(el));
    }
    
    const showFormError = (form, message = '') => {
        const error = form.querySelector('.form-error');
        if (error) {
            error.textContent = message;
            error.style.display = message ? 'block' : 'none';
        }
    };
    
    const showFormSuccess = (form, message = '') => {
        const success = form.querySelector('.form-success-inline');
        if (success) {
            success.textContent = message;
            success.style.display = message ? 'block' : 'none';
        }
    };

    // Contact Form Handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            showFormError(contactForm, '');
            showFormSuccess(contactForm, '');
            
            if (!data.name || !data.phone || !data.service || !data.message) {
                showFormError(contactForm, 'Please complete all required fields.');
                return;
            }
            if (!contactForm.querySelector('#contact-consent').checked) {
                showFormError(contactForm, 'Please check the consent box.');
                return;
            }
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Sending...';
            submitBtn.disabled = true;
            
            fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            }).then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                contactForm.reset();
                showFormSuccess(contactForm, 'Message sent! We’ll call you shortly.');
            }).catch(() => {
                showFormError(contactForm, 'Something went wrong. Please call us or try again.');
            }).finally(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
        });
    }
    
    // Phone number formatting
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.length <= 3) {
                    value = `(${value}`;
                } else if (value.length <= 6) {
                    value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                } else {
                    value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
                }
            }
            e.target.value = value;
        });
    });
});

/**
 * Multi-step Form Handler for Apply page
 */
class MultiStepForm {
    constructor(formElement) {
        this.form = formElement;
        this.sections = this.form.querySelectorAll('.form-section');
        this.progressSteps = this.form.parentElement.querySelectorAll('.progress-step, .step-btn');
        this.currentStep = 0;
        
        this.init();
    }
    
    init() {
        // Show first section
        this.showSection(0);
        
        // Allow clicking progress/step pills
        if (this.progressSteps.length) {
            this.progressSteps.forEach((stepBtn, index) => {
                stepBtn.addEventListener('click', () => this.showSection(index));
            });
        }
        
        // Handle next/prev buttons
        this.form.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="next"]')) {
                e.preventDefault();
                if (this.validateCurrentSection()) {
                    this.nextSection();
                }
            }
            
            if (e.target.matches('[data-action="prev"]')) {
                e.preventDefault();
                this.prevSection();
            }
        });
        
        // Handle form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateCurrentSection()) {
                this.submitForm();
            }
        });
    }
    
    showSection(index) {
        // Hide all sections
        this.sections.forEach((section, i) => {
            section.classList.remove('active');
            if (this.progressSteps[i]) {
                this.progressSteps[i].classList.remove('active');
                this.progressSteps[i].classList.remove('step-btn--active');
                if (i < index) {
                    this.progressSteps[i].classList.add('completed');
                } else {
                    this.progressSteps[i].classList.remove('completed');
                }
            }
        });
        
        // Show current section
        if (this.sections[index]) {
            this.sections[index].classList.add('active');
        }
        if (this.progressSteps[index]) {
            this.progressSteps[index].classList.add('active');
            this.progressSteps[index].classList.add('step-btn--active');
        }
        
        this.currentStep = index;
        
        // Toggle action buttons
        const prevBtn = this.form.querySelector('.prev-btn');
        const nextBtn = this.form.querySelector('.next-btn');
        const submitBtn = this.form.querySelector('.submit-btn');
        
        if (prevBtn) {
            prevBtn.style.display = index === 0 ? 'none' : 'inline-flex';
        }
        if (nextBtn) {
            nextBtn.style.display = index === this.sections.length - 1 ? 'none' : 'inline-flex';
        }
        if (submitBtn) {
            submitBtn.style.display = index === this.sections.length - 1 ? 'inline-flex' : 'none';
        }
        
        // Scroll to top of form
        this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    nextSection() {
        if (this.currentStep < this.sections.length - 1) {
            this.showSection(this.currentStep + 1);
        }
    }
    
    prevSection() {
        if (this.currentStep > 0) {
            this.showSection(this.currentStep - 1);
        }
    }
    
    validateCurrentSection() {
        const currentSection = this.sections[this.currentStep];
        const requiredFields = currentSection.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('error');
                field.addEventListener('input', () => {
                    field.classList.remove('error');
                }, { once: true });
            }
        });
        
        if (!isValid) {
            const errorBox = this.form.querySelector('.form-error');
            if (errorBox) {
                errorBox.textContent = 'Please complete the highlighted fields.';
                errorBox.style.display = 'block';
            }
            return false;
        } else {
            const errorBox = this.form.querySelector('.form-error');
            if (errorBox) {
                errorBox.style.display = 'none';
            }
        }
        // Consent checkbox (if present)
        const consent = this.form.querySelector('input[name="consent"]');
        if (consent && !consent.checked) {
            const errorBox = this.form.querySelector('.form-error');
            if (errorBox) {
                errorBox.textContent = 'Please check the consent box.';
                errorBox.style.display = 'block';
            }
            return false;
        }

        return isValid;
    }
    
    submitForm() {
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData);
        
        // Show loading state
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Submitting...';
        submitBtn.disabled = true;
        
        fetch(this.form.action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        }).then(response => {
            if (!response.ok) throw new Error('Network error');
            this.form.style.display = 'none';
            const successMessage = this.form.parentElement.querySelector('.form-success');
            if (successMessage) {
                successMessage.style.display = 'block';
                successMessage.classList.add('active');
            }
        }).catch(() => {
            const errorBox = this.form.querySelector('.form-error');
            if (errorBox) {
                errorBox.textContent = 'Something went wrong. Please try again.';
                errorBox.style.display = 'block';
            }
        }).finally(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    }
}

// Initialize multi-step form if present
document.addEventListener('DOMContentLoaded', function() {
    const multiStepForms = document.querySelectorAll('.apply-form, .multi-step');
    multiStepForms.forEach(form => new MultiStepForm(form));
});

/**
 * Caregiver Application Form Handler
 */
document.addEventListener('DOMContentLoaded', function() {
    const caregiverForm = document.getElementById('caregiver-form');
    if (caregiverForm) {
        // File upload preview
        const fileInput = caregiverForm.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                const fileName = e.target.files[0]?.name;
                const label = fileInput.closest('.file-upload').querySelector('.file-upload__text');
                if (label && fileName) {
                    label.textContent = fileName;
                }
            });
        }
        
        // Form submission
        caregiverForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(caregiverForm);
            const data = Object.fromEntries(formData);
            
            // Validate
            const requiredFields = caregiverForm.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');
                }
            });
            
            if (!isValid) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Show loading
            const submitBtn = caregiverForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = 'Submitting Application...';
            submitBtn.disabled = true;
            
            // Simulate submission
            setTimeout(() => {
                alert('Thank you for your application! Our hiring team will review your information and contact you within 3-5 business days.');
                caregiverForm.reset();
                submitBtn.innerHTML = 'Submit Application';
                submitBtn.disabled = false;
            }, 2000);
        });
    }
});
