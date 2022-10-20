/**
 * Faster animations for FunCAPTCHA.
 */

(async () => {
    const SPEED = 100;

    window.addEventListener('load', function (event) {
        const sheet = document.body.appendChild(document.createElement('style')).sheet;
        sheet.insertRule(`.loader-ctn.fade-out {transition-duration: ${1/SPEED}s !important}`, 0);
        sheet.insertRule(`.loader-ctn.fade-in {transition-duration: ${1/SPEED}s !important}`, 1);
        sheet.insertRule(`#svg-fc-spinner {transition-duration: ${1/SPEED}s !important}`, 2);
    });
})();
