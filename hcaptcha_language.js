
function scanHead() {
    const currentLanguage = navigator.language.split('-')[0];
    for(const element of document.querySelectorAll(`script[src*=".hcaptcha.com/1/api.js"]`)) {
        const url = new URL(element.src);
        const lang = url.searchParams.get('hl') || currentLanguage;
        if(lang === "en") continue;
        url.searchParams.set('hl', 'en');
        element.src = url.toString();
    }
}

const observer = new MutationObserver(scanHead);

// head isnt ready yet
setTimeout(() => {
    scanHead();
    observer.observe(document.head, { childList: true });
}, 0);
