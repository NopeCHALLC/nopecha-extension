export const VERSION = 'firefox';

export const browser = globalThis.browser;

export function reconnect_scripts() {
    // Reconnect existing scripts on upgrade
    browser.runtime.onInstalled.addListener(async () => {
        for (const cs of browser.runtime.getManifest().content_scripts) {
            browser.tabs.query({url: cs.matches}, tabs => {
                for (const tab of tabs) {
                    browser.scripting.executeScript({
                        target: {tabId: tab.id},
                        files: cs.js,
                    });
                }
            });
        }
    });
}

export function register_language() {
    // Force set language to English for reCAPTCHA
    browser.webRequest.onBeforeSendHeaders.addListener(e => {
        const url = new URL(e.url);
        if (url.searchParams.get('hl') !== 'en-US') {
            url.searchParams.set('hl', 'en-US');
            return {redirectUrl: url.toString()};
        }
    }, {urls: [
        '*://*.google.com/recaptcha/*',
        '*://*.recaptcha.net/recaptcha/*',
    ], types: ['sub_frame']}, ['blocking']);

    // Force set language to English for FunCAPTCHA
    browser.webRequest.onBeforeSendHeaders.addListener(e => {
        const url = new URL(e.url);
        if (url.searchParams.get('lang') !== 'en') {
            url.searchParams.set('lang', 'en');
            return {redirectUrl: url.toString()};
        }
    }, {urls: [
        '*://*.funcaptcha.co/*',
        '*://*.funcaptcha.com/*',
        '*://*.arkoselabs.com/*',
        '*://*.arkoselabs.cn/*',
        '*://*.arkose.com.cn/*',
    ], types: ['sub_frame']}, ['blocking']);
}
