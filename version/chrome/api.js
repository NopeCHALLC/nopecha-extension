
export const VERSION = 'chrome';

export const browser = globalThis.chrome;

export function registerHlFilter(){
    const lang = 'en-US';
    browser.declarativeNetRequest.updateDynamicRules({
        addRules: [
            {
                'id': 1,
                'priority': 1,
                'action': {
                    'type': 'redirect',
                    'redirect': {
                        'transform': {
                            'queryTransform': {
                                'addOrReplaceParams': [
                                    {'key': 'hl', 'value': lang},
                                ],
                            },
                        },
                    },
                },
                'condition': {
                    'regexFilter': '^https://[^\\.]*\\.(google|recaptcha)\\.(com|net)/recaptcha',
                    'resourceTypes': [
                        'sub_frame',
                        'script',
                    ],
                },
            },
        ],
        removeRuleIds: [1],
    });
}
