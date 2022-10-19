
export const VERSION = 'firefox';

export const browser = globalThis.browser;

export function registerHlFilter(){
    const lang = 'en-US';
    browser.webRequest.onBeforeSendHeaders.addListener(e => {
        const url = new URL(e.url);
        if (url.searchParams.get('hl') !== lang) {
            url.searchParams.set('hl', lang);
            return {redirectUrl: url.toString()};
        }
    }, {urls: [
        '*://*.google.com/recaptcha/*',
        '*://*.recaptcha.net/recaptcha/*',
    ], types: ['sub_frame']}, ['blocking']);
}
