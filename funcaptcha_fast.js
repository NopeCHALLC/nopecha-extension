/**
 * Faster animations for FunCAPTCHA.
 */

(async () => {
    window.addEventListener('load', () => {
        const sheet = document.body.appendChild(document.createElement('style')).sheet;
        sheet.insertRule('* {transition-duration: 0s !important}', 0);
    });
})();
