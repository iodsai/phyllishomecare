/**
 * PHYLLIS HOME CARE - Client Intake Form
 * Multi-step form with validation
 */

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    function init() {
        var form = document.getElementById('intake-form');
        if (!form) return; // Exit if not on intake page
        
        var steps = document.querySelectorAll('.form-step');
        var progressSteps = document.querySelectorAll('.progress-step');
        var currentStep = 1;
        var formLoadTime = Date.now();
        var MIN_FILL_TIME = 5000; // 5 seconds minimum (reduced for testing)
        var isSubmitting = false;
        
        // Rate limiter
        var submissions = [];
        var maxSubmissions = 5; // Increased for testing
        var windowMs = 300000; // 5 minutes
        
        function canSubmit() {
            var now = Date.now();
            submissions = submissions.filter(function(time) {
                return now - time < windowMs;
            });
            if (submissions.length >= maxSubmissions) {
                return false;
            }
            submissions.push(now);
            return true;
        }
        
        function showStep(step) {
            // Hide all steps
            steps.forEach(function(s) {
                s.classList.remove('active');
            });
            
            // Show target step
            var targetStep = document.querySelector('.form-step[data-step="' + step + '"]');
            if (targetStep) {
                targetStep.classList.add('active');
            }
            
            // Update progress indicators
            progressSteps.forEach(function(p, index) {
                p.classList.remove('active', 'completed');
                if (index + 1 < step) {
                    p.classList.add('completed');
                } else if (index + 1 === step) {
                    p.classList.add('active');
                }
            });
            
            currentStep = step;
            
            // Scroll to top of form
            if (form) {
                form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        
        function validateStep(step) {
            var stepEl = document.querySelector('.form-step[data-step="' + step + '"]');
            if (!stepEl) return true;
            
            var requiredFields = stepEl.querySelectorAll('[required]');
            var isValid = true;
            
            requiredFields.forEach(function(field) {
                // Clear previous error state
                field.classList.remove('error');
                
                // Skip checkboxes in this loop - handle separately
                if (field.type === 'checkbox') {
                    if (!field.checked) {
                        isValid = false;
                        field.classList.add('error');
                    }
                    return;
                }
                
                if (!field.value || !field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');
                }
                
                // Email validation
                if (field.type === 'email' && field.value) {
                    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(field.value)) {
                        isValid = false;
                        field.classList.add('error');
                    }
                }
                
                // Phone validation
                if (field.type === 'tel' && field.value) {
                    var digits = field.value.replace(/\D/g, '');
                    if (digits.length < 10) {
                        isValid = false;
                        field.classList.add('error');
                    }
                }
            });
            
            // Check for at least one service selected on step 3
            if (step === 3) {
                var services = stepEl.querySelectorAll('input[name="services"]:checked');
                if (services.length === 0) {
                    isValid = false;
                    showError('Please select at least one service.');
                    return false;
                }
            }
            
            if (!isValid) {
                showError('Please complete all required fields.');
            } else {
                hideError();
            }
            
            return isValid;
        }
        
        function showError(message) {
            var errorEl = form.querySelector('.form-error');
            if (errorEl) {
                errorEl.textContent = message;
                errorEl.style.display = 'block';
                // Scroll to error
                errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        function hideError() {
            var errorEl = form.querySelector('.form-error');
            if (errorEl) {
                errorEl.style.display = 'none';
            }
        }
        
        function showSuccess() {
            form.style.display = 'none';
            var progressEl = document.querySelector('.intake-progress');
            if (progressEl) {
                progressEl.style.display = 'none';
            }
            var successEl = document.getElementById('form-success');
            if (successEl) {
                successEl.style.display = 'block';
                successEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        
        // Next button handlers
        var nextBtns = document.querySelectorAll('.next-btn');
        nextBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var nextStep = parseInt(this.getAttribute('data-next'));
                if (validateStep(currentStep)) {
                    showStep(nextStep);
                }
            });
        });
        
        // Previous button handlers
        var prevBtns = document.querySelectorAll('.prev-btn');
        prevBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var prevStep = parseInt(this.getAttribute('data-prev'));
                showStep(prevStep);
            });
        });
        
        // Progress step click handlers
        progressSteps.forEach(function(step, index) {
            step.addEventListener('click', function() {
                var targetStep = index + 1;
                // Only allow going back, not forward (must validate)
                if (targetStep < currentStep) {
                    showStep(targetStep);
                }
            });
        });
        
        // Form submission
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            console.log('Form submit triggered'); // Debug
            
            if (isSubmitting) {
                console.log('Already submitting, skipping');
                return;
            }
            
            // Validate final step
            if (!validateStep(4)) {
                console.log('Validation failed');
                return;
            }
            
            // Check consent
            var consentBox = form.querySelector('#consent');
            if (consentBox && !consentBox.checked) {
                showError('Please check the consent box to continue.');
                console.log('Consent not checked');
                return;
            }
            
            // Rate limiting
            if (!canSubmit()) {
                showError('Too many submissions. Please wait a few minutes before trying again.');
                console.log('Rate limited');
                return;
            }
            
            // Honeypot check
            var honeypot = form.querySelector('input[name="_gotcha"]');
            if (honeypot && honeypot.value) {
                console.log('Honeypot triggered');
                showSuccess();
                return;
            }
            
            // Time-based bot check - be more lenient
            var fillTime = Date.now() - formLoadTime;
            console.log('Fill time: ' + fillTime + 'ms');
            if (fillTime < MIN_FILL_TIME) {
                // Instead of silently failing, just proceed anyway for real users
                console.log('Fast submission detected but proceeding');
            }
            
            isSubmitting = true;
            hideError();
            
            var submitBtn = form.querySelector('button[type="submit"]');
            var originalText = submitBtn ? submitBtn.innerHTML : 'Submit';
            
            if (submitBtn) {
                submitBtn.innerHTML = 'Submitting...';
                submitBtn.disabled = true;
            }
            
            var formData = new FormData(form);
            var formAction = form.getAttribute('action') || 'https://formspree.io/f/maqyvorl';
            
            console.log('Submitting to: ' + formAction);
            
            fetch(formAction, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            })
            .then(function(response) {
                console.log('Response status: ' + response.status);
                if (!response.ok) {
                    throw new Error('Network response was not ok: ' + response.status);
                }
                return response.json();
            })
            .then(function(data) {
                console.log('Success:', data);
                showSuccess();
            })
            .catch(function(err) {
                console.error('Form submission error:', err);
                showError('Something went wrong. Please call us at (302) 446-3986.');
                if (submitBtn) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
                isSubmitting = false;
            });
        });
        
        // Phone number formatting
        var phoneInputs = document.querySelectorAll('input[type="tel"]');
        phoneInputs.forEach(function(input) {
            input.addEventListener('input', function(e) {
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
            });
        });
        
        // Clear error state on input
        var allFields = form.querySelectorAll('input, select, textarea');
        allFields.forEach(function(field) {
            field.addEventListener('input', function() {
                this.classList.remove('error');
            });
            field.addEventListener('change', function() {
                this.classList.remove('error');
            });
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
