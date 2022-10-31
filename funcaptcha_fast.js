/**
 * Faster animations for FunCAPTCHA.
 */

(async () => {
    window.addEventListener('load', () => {
        const sheet = document.body.appendChild(document.createElement('style')).sheet;
        sheet.insertRule('* {transition-duration: 0s !important}', 0);
        sheet.insertRule('li > a::after {border: 12px solid rgba(0, 255, 0, 0.9) !important}', 1);
        sheet.insertRule('#interstitial {backdrop-filter: none !important}', 2);
        sheet.insertRule('#interstitial {background-color: transparent !important}', 3);
        // sheet.insertRule('#interstitial {opacity: 0.7 !important}', 4);
    });
})();
