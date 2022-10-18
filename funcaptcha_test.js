(async () => {
    class BG {
        static exec(method, data) {
            return new Promise(resolve => {
                try {
                    chrome.runtime.sendMessage({method, data}, resolve);
                } catch (e) {
                    console.log('exec failed', e);
                    resolve();
                }
            });
        }
    }

    class Net {
        static async fetch(url, options) {
            return await BG.exec('fetch', {url, options});
        }
    }


    console.log('window.location.href', window.location.href);
    if (window.location.href !== 'https://nopecha.com/admin/demo') {
        return;
    }

    const KEYS = {
        'demo': '69A21A01-CC7B-B9C6-0F9A-E7FA06677FFC',
        'github': '20782B4C-05D0-45D7-97A0-41641055B6F6',
        // 'roblox': 'A2A14B1D-1AF3-C791-9BBC-EE33CC7A0A6F',
        // 'roblox': '9F35E182-C93C-EBCC-A31D-CF8ED317B996',
        'roblox': '476068BF-9607-4799-B53D-966BE98E2B81',
        'paypal': '9409E63B-D2A5-9CBD-DBC0-5095707D0090',
        'blizzard': 'E8A75615-1CBA-5DFF-8032-D16BCF234E10',
        'linkedin': '3117BF26-4762-4F5A-8ED9-A85E69209A46',
        'twitch': 'E5554D43-23CC-1982-971D-6A2262A2CA24',
        // 'outlook': 'B7D8911C-5CC8-A9A3-35B0-554ACEE604DA',
    };

    const n = 3;
    // load_captcha(KEYS['github'], 'https://www.github.com', '#frames0', n);
    // load_captcha(KEYS['roblox'], 'https://www.roblox.com', '#frames0', n);
    load_captcha(KEYS['twitch'], 'https://www.twitch.com', '#frames0', n);
    load_captcha(KEYS['paypal'], 'https://www.paypal.com', '#frames1', n);
    load_captcha(KEYS['demo'], 'https://www.funcaptcha.com', '#frames2', n);
    load_captcha(KEYS['blizzard'], 'https://account.battle.net', '#frames3', n);
    // load_captcha(KEYS['linkedin'], 'https://linkedin-api.arkoselabs.com', '#frames4', n);
    // for (let i = 0; i < n; i++) {
    //     const src = 'https://iframe.arkoselabs.com/B7D8911C-5CC8-A9A3-35B0-554ACEE604DA/index.html';
    //     const $frame = create_frame(src);
    //     document.querySelector('#frames5').append($frame);
    // }

    function create_frame(src) {
        const $frame = document.createElement('iframe');
        $frame.frameborder = 0;
        $frame.scrolling = 'no';
        $frame.src = src;
        return $frame;
    }

    async function load_captcha(pkey, host, parent_selector, n=3) {
        for (let i = 0; i < n; i++) {
            const url = `https://api.funcaptcha.com/fc/gt2/public_key/${pkey}`;
            const r = await Net.fetch(url, {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US,en;q=0.9",
                    "cache-control": "no-cache",
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "pragma": "no-cache",
                    "sec-ch-ua": "\"Google Chrome\";v=\"105\", \"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"105\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Linux\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "cross-site"
                },
                "referrer": host,
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": `bda=&public_key=${pkey}&site=${encodeURIComponent(host)}&language=en&userbrowser=Mozilla%2F5.0%20(X11%3B%20Linux%20x86_64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F105.0.0.0%20Safari%2F537.36&rnd=${Math.random()}`,
                "method": "POST",
                "mode": "cors",
                "credentials": "omit"
            });

            const data = JSON.parse(r);
            // console.log('data', data);
            // console.log('data.token', data.token);

            const params = {};
            for (const e of data.token.split('|')) {
                const kv = e.split('=');
                let k = kv[0];
                let v = kv[1];
                if (!kv[1]) {
                    k = 'token';
                    v = kv[0];
                }
                if (k.endsWith('url')) {
                    v = decodeURIComponent(v);
                }
                params[k] = v;
            }
            const url_params = (new URLSearchParams(params)).toString();
            const src = `https://api.funcaptcha.com/fc/gc/?${url_params}`;
            console.log('src', src);

            // iframe#frame0(frameborder='0' scrolling='no' aria-label=' ' style='width: 350px; height: 300px;')
            const $frame = create_frame(src);
            document.querySelector(parent_selector).append($frame);
        }
    }
})();
