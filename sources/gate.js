/**
 * Shuban Singh Singraur - Portfolio Security Gate
 * Passcode: "Shuban"
 */
(function() {
    'use strict';

    var STORAGE_KEY = 'portfolio_unlocked';
    // Base64 hash for "shuban" (case-insensitive)
    var PASS_HASH_B64 = 'c2h1YmFu';
    // SHA-256 hash of "shuban"
    var PASS_SHA256 = 'c7683e7fd055dee6d24b69b7a5cc8792d46d04a5c02ce331bb37f9d4cf496384';

    function isUnlocked() {
        try {
            return sessionStorage.getItem(STORAGE_KEY) === 'true' || 
                   localStorage.getItem(STORAGE_KEY) === 'true';
        } catch(e) {
            return false;
        }
    }

    // Apply locked class immediately to prevent any visual flash of portfolio
    if (!isUnlocked()) {
        document.documentElement.classList.add('portfolio-locked');
    }

    async function verifyPasscode(input) {
        var clean = (input || '').trim();
        if (!clean) return false;

        // 1. Case-insensitive string / base64 validation
        try {
            if (btoa(clean.toLowerCase()) === PASS_HASH_B64) {
                return true;
            }
        } catch(e) {}

        // 2. Direct equality backup
        if (clean.toLowerCase() === 'shuban') {
            return true;
        }

        // 3. Web Crypto API SHA-256 check
        try {
            if (window.crypto && window.crypto.subtle) {
                var encoder = new TextEncoder();
                var data = encoder.encode(clean.toLowerCase());
                var hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
                var hashHex = Array.from(new Uint8Array(hashBuffer))
                    .map(function(b) { return b.toString(16).padStart(2, '0'); })
                    .join('');
                if (hashHex === PASS_SHA256) return true;
            }
        } catch(e) {}

        return false;
    }

    function createGateMarkup() {
        var overlay = document.createElement('div');
        overlay.id = 'portfolio-gate-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Portfolio Access Verification');

        overlay.innerHTML = 
            '<div class="gate-scanner"></div>' +
            '<div id="portfolio-gate-card">' +
                '<div class="gate-status-pill" id="gateStatusPill">' +
                    '<span class="gate-status-dot"></span>' +
                    '<span id="gateStatusText">Access Restricted</span>' +
                '</div>' +
                '<div class="gate-emblem-wrap">' +
                    '<div class="gate-emblem-halo"></div>' +
                    '<div class="gate-emblem-inner" id="gateEmblemIcon">' +
                        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                            '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>' +
                            '<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' +
                        '</svg>' +
                    '</div>' +
                '</div>' +
                '<h1 class="gate-title">SHUBAN SINGH</h1>' +
                '<p class="gate-subtitle">Aerospace Engineering Portfolio. Please enter the passcode to access all projects and case studies.</p>' +
                '<form class="gate-form" id="portfolioGateForm" onsubmit="return false;" novalidate>' +
                    '<div class="gate-input-wrapper">' +
                        '<span class="gate-input-icon">' +
                            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                                '<circle cx="8" cy="15" r="4"></circle>' +
                                '<path d="M10.85 12.15L19 4"></path>' +
                                '<path d="M18 5l2 2"></path>' +
                                '<path d="M15 8l2 2"></path>' +
                            '</svg>' +
                        '</span>' +
                        '<input type="password" id="gatePasswordInput" class="gate-input" placeholder="Enter passcode..." autocomplete="current-password" autofocus required />' +
                        '<button type="button" class="gate-toggle-visibility" id="gateTogglePass" title="Toggle passcode visibility" aria-label="Toggle passcode visibility">' +
                            '<svg id="gateEyeIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                                '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>' +
                                '<circle cx="12" cy="12" r="3"></circle>' +
                            '</svg>' +
                        '</button>' +
                    '</div>' +
                    '<div class="gate-error-banner" id="gateErrorBanner">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                            '<circle cx="12" cy="12" r="10"></circle>' +
                            '<line x1="12" y1="8" x2="12" y2="12"></line>' +
                            '<line x1="12" y1="16" x2="12.01" y2="16"></line>' +
                        '</svg>' +
                        '<span>Incorrect passcode. Please try again.</span>' +
                    '</div>' +
                    '<button type="submit" class="gate-submit-btn" id="gateSubmitBtn">' +
                        '<span>Unlock Portfolio</span>' +
                        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
                            '<line x1="5" y1="12" x2="19" y2="12"></line>' +
                            '<polyline points="12 5 19 12 12 19"></polyline>' +
                        '</svg>' +
                    '</button>' +
                    '<label class="gate-options-row">' +
                        '<input type="checkbox" id="gateRememberCheck" checked />' +
                        '<span>Remember access on this browser</span>' +
                    '</label>' +
                '</form>' +
            '</div>';

        return overlay;
    }

    function initGate() {
        if (isUnlocked()) {
            document.documentElement.classList.remove('portfolio-locked');
            return;
        }

        // Mount overlay if not already in DOM
        var existing = document.getElementById('portfolio-gate-overlay');
        if (!existing) {
            existing = createGateMarkup();
            document.body.appendChild(existing);
        }

        var form = document.getElementById('portfolioGateForm');
        var input = document.getElementById('gatePasswordInput');
        var toggleBtn = document.getElementById('gateTogglePass');
        var eyeIcon = document.getElementById('gateEyeIcon');
        var errorBanner = document.getElementById('gateErrorBanner');
        var submitBtn = document.getElementById('gateSubmitBtn');
        var rememberCheck = document.getElementById('gateRememberCheck');
        var card = document.getElementById('portfolio-gate-card');
        var statusPill = document.getElementById('gateStatusPill');
        var statusText = document.getElementById('gateStatusText');
        var emblemIcon = document.getElementById('gateEmblemIcon');

        // Focus input
        setTimeout(function() {
            if (input) input.focus();
        }, 150);

        // Toggle password view
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function() {
                if (input.type === 'password') {
                    input.type = 'text';
                    eyeIcon.innerHTML = 
                        '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>' +
                        '<line x1="1" y1="1" x2="23" y2="23"></line>';
                } else {
                    input.type = 'password';
                    eyeIcon.innerHTML = 
                        '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>' +
                        '<circle cx="12" cy="12" r="3"></circle>';
                }
            });
        }

        // Clear error on input
        if (input) {
            input.addEventListener('input', function() {
                input.classList.remove('input-error');
                if (errorBanner) errorBanner.classList.remove('visible');
            });
        }

        async function handleUnlock() {
            var val = input.value;
            var isCorrect = await verifyPasscode(val);

            if (isCorrect) {
                // Success
                var remember = rememberCheck ? rememberCheck.checked : true;
                try {
                    sessionStorage.setItem(STORAGE_KEY, 'true');
                    if (remember) {
                        localStorage.setItem(STORAGE_KEY, 'true');
                    } else {
                        localStorage.removeItem(STORAGE_KEY);
                    }
                } catch(e) {}

                // Visual success feedback
                card.classList.add('success');
                statusPill.classList.add('unlocked');
                statusText.textContent = 'ACCESS GRANTED';
                emblemIcon.innerHTML = 
                    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
                        '<polyline points="20 6 9 17 4 12"></polyline>' +
                    '</svg>';

                submitBtn.classList.add('success');
                submitBtn.innerHTML = 
                    '<span>Access Granted</span>' +
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
                        '<polyline points="20 6 9 17 4 12"></polyline>' +
                    '</svg>';

                // Dismiss intro preloader if it exists on index.html
                if (typeof window.dismissPreloader === 'function') {
                    window.dismissPreloader();
                } else {
                    var prel = document.getElementById('preloader');
                    if (prel) {
                        prel.classList.add('preloader--done');
                        document.body.classList.remove('preloader-active');
                    }
                }

                // Unlock document
                setTimeout(function() {
                    existing.classList.add('gate-closing');
                    document.documentElement.classList.remove('portfolio-locked');
                    setTimeout(function() {
                        existing.classList.add('gate-hidden');
                    }, 450);
                }, 350);

            } else {
                // Failure / shake
                input.classList.add('input-error');
                if (errorBanner) errorBanner.classList.add('visible');
                card.classList.remove('gate-shake');
                void card.offsetWidth; // trigger reflow
                card.classList.add('gate-shake');
                input.focus();
                input.select();
            }
        }

        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                handleUnlock();
            });
        }
    }

    // Expose lockPortfolio globally so user can easily re-lock anytime
    window.lockPortfolio = function() {
        try {
            sessionStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_KEY);
        } catch(e) {}
        window.location.reload();
    };

    // Keyboard shortcut to test / re-lock: Alt + Shift + L
    window.addEventListener('keydown', function(e) {
        if (e.altKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
            e.preventDefault();
            window.lockPortfolio();
        }
    });

    // Initialize when DOM is available
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGate);
    } else {
        initGate();
    }
})();
