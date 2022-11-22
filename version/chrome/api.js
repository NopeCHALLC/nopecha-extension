export const VERSION = 'chrome';

export const browser = globalThis.chrome;

export function reconnect_scripts() {
    // Reconnect existing scripts on upgrade
    browser.runtime.onInstalled.addListener(async () => {
        for (const cs of browser.runtime.getManifest().content_scripts) {
            for (const tab of await browser.tabs.query({url: cs.matches})) {
                browser.scripting.executeScript({
                    target: {tabId: tab.id},
                    files: cs.js,
                });
            }
        }
    });
}

export function register_language() {
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
                    'regexFilter': '^(http|https)://[^\\.]*\\.(google\\.com|recaptcha\\.net)/recaptcha',
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
                    'regexFilter': '^(http|https)://[^\\.]*\\.(funcaptcha\\.(co|com)|arkoselabs\\.(com|cn)|arkose\\.com\\.cn)',
                    'resourceTypes': ['sub_frame'],
                },
            },
        ],
        removeRuleIds: [1, 2],
    });
}
