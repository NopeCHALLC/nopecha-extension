export const VERSION = 'firefox';

export const browser = globalThis.browser;

export function register_language() {
    // Reconnect existing scripts on upgrade
    // https://stackoverflow.com/questions/10994324/chrome-extension-content-script-re-injection-after-upgrade-or-install/11598753#11598753
    browser.runtime.onInstalled.addListener(async () => {
        console.log('reconnect');
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
