/**
 * Sets the hCaptcha language to English.
 */

(() => {
    const TARGET_LANG = 'en';
    let observer;

    function scan_head() {
        const current_language = navigator.language.split('-')[0];
        for (const $e of document.querySelectorAll(`script[src*="hcaptcha.com/1/api.js"]`)) {
            // observer.disconnect();
            const url = new URL($e.src);
            const lang = url.searchParams.get('hl') || current_language;
            if (lang === TARGET_LANG) {
                continue;
            }
            url.searchParams.set('hl', TARGET_LANG);
            $e.src = url.toString();
        }
    }

    observer = new MutationObserver(scan_head);

    // Wait for head
    setTimeout(() => {
        scan_head();
        observer.observe(document.head, {childList: true});

        // // Stop observer timeout
        // setTimeout(() => {
        //     observer.disconnect();
        //     console.log('disconnected observer');
        // }, 1000 * 60);
    }, 0);

})();
