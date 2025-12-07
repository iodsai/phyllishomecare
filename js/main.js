/**
 * PHYLLIS HOME CARE - Main JavaScript
 * Handles navigation, forms, and interactions
 */

document.addEventListener('DOMContentLoaded', function() {
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
    
    // Contact Form Handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            
            // Simple validation
            if (!data.name || !data.email || !data.message) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Simulate form submission
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Sending...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                alert('Thank you for your message! We will get back to you within 24 hours.');
                contactForm.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 1500);
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
        this.progressSteps = document.querySelectorAll('.progress-step');
        this.currentStep = 0;
        
        this.init();
    }
    
    init() {
        // Show first section
        this.showSection(0);
        
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
        }
        
        this.currentStep = index;
        
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
            alert('Please fill in all required fields.');
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
        
        // Simulate submission
        setTimeout(() => {
            // Hide form, show success
            this.form.style.display = 'none';
            const successMessage = document.querySelector('.form-success');
            if (successMessage) {
                successMessage.classList.add('active');
            }
            
            console.log('Form submitted:', data);
        }, 2000);
    }
}

// Initialize multi-step form if present
document.addEventListener('DOMContentLoaded', function() {
    const applyForm = document.getElementById('apply-form');
    if (applyForm) {
        new MultiStepForm(applyForm);
    }
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
