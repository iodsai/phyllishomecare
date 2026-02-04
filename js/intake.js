/**
 * PHYLLIS HOME CARE - Client Intake Form
 * Multi-step form - simplified submission
 */

(function() {
    'use strict';
    
    function init() {
        var form = document.getElementById('intake-form');
        if (!form) return;
        
        var steps = document.querySelectorAll('.form-step');
        var progressSteps = document.querySelectorAll('.progress-step');
        var currentStep = 1;
        var isSubmitting = false;
        
        function showStep(step) {
            steps.forEach(function(s) {
                s.classList.remove('active');
            });
            
            var targetStep = document.querySelector('.form-step[data-step="' + step + '"]');
            if (targetStep) {
                targetStep.classList.add('active');
            }
            
            progressSteps.forEach(function(p, index) {
                p.classList.remove('active', 'completed');
                if (index + 1 < step) {
                    p.classList.add('completed');
                } else if (index + 1 === step) {
                    p.classList.add('active');
                }
            });
            
            currentStep = step;
            
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
                field.classList.remove('error');
                
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
                
                if (field.type === 'email' && field.value) {
                    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(field.value)) {
                        isValid = false;
                        field.classList.add('error');
                    }
                }
                
                if (field.type === 'tel' && field.value) {
                    var digits = field.value.replace(/\D/g, '');
                    if (digits.length < 10) {
                        isValid = false;
                        field.classList.add('error');
                    }
                }
            });
            
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
                if (targetStep < currentStep) {
                    showStep(targetStep);
                }
            });
        });
        
        // Form submission - simple and direct
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (isSubmitting) return;
            
            if (!validateStep(4)) return;
            
            var consentBox = form.querySelector('#consent');
            if (consentBox && !consentBox.checked) {
                showError('Please check the consent box to continue.');
                return;
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
            
            fetch(formAction, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Submission failed');
                }
                return response.json();
            })
            .then(function() {
                showSuccess();
            })
            .catch(function(err) {
                console.error('Error:', err);
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
        
        // Clear error on input
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
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
