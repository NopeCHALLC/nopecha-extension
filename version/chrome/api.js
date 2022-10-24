export const VERSION = 'chrome';

export const browser = globalThis.chrome;

export function register_language() {
    // Reconnect existing scripts on upgrade
    // https://stackoverflow.com/questions/10994324/chrome-extension-content-script-re-injection-after-upgrade-or-install/11598753#11598753
    browser.runtime.onInstalled.addListener(async () => {
        console.log('reconnect');
        for (const cs of browser.runtime.getManifest().content_scripts) {
            for (const tab of await browser.tabs.query({url: cs.matches})) {
                browser.scripting.executeScript({
                    target: {tabId: tab.id},
                    files: cs.js,
                });
            }
        }
    });

    browser.declarativeNetRequest.updateDynamicRules({
        addRules: [
            // Force set language to English for reCAPTCHA
            {
                'id': 1,
                'priority': 1,
                'action': {
                    'type': 'redirect',
                    'redirect': {
                        'transform': {
                            'queryTransform': {
                                'addOrReplaceParams': [
                                    {'key': 'hl', 'value': 'en-US'},
                                ],
                            },
                        },
                    },
                },
                'condition': {
                    'regexFilter': '^https://[^\\.]*\\.(google\\.com|recaptcha\\.net)/recaptcha',
                    'resourceTypes': ['sub_frame'],
                },
            },
            // Force set language to English for FunCAPTCHA
            {
                'id': 2,
                'priority': 1,
                'action': {
                    'type': 'redirect',
                    'redirect': {
                        'transform': {
                            'queryTransform': {
                                'addOrReplaceParams': [
                                    {'key': 'lang', 'value': 'en'},
                                ],
                            },
                        },
                    },
                },
                'condition': {
                    'regexFilter': '^https://[^\\.]*\\.(funcaptcha\\.(co|com)|arkoselabs\\.(com|cn)|arkose\\.com\\.cn)',
                    'resourceTypes': ['sub_frame'],
                },
            },
        ],
        removeRuleIds: [1, 2],
    });
}
