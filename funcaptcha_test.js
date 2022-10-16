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
        'roblox': 'A2A14B1D-1AF3-C791-9BBC-EE33CC7A0A6F',
        // 'roblox': '9F35E182-C93C-EBCC-A31D-CF8ED317B996',
        'paypal': '9409E63B-D2A5-9CBD-DBC0-5095707D0090',
    };

    load_captcha(KEYS['github'], 'https://www.github.com', '#frame0');
    load_captcha(KEYS['paypal'], 'https://www.paypal.com', '#frame1');
    load_captcha(KEYS['demo'], 'https://www.funcaptcha.com', '#frame2');

    async function load_captcha(pkey, host, selector) {
        // const url = `https://roblox-api.arkoselabs.com/fc/gt2/public_key/${pkey}`;
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
        console.log('data', data);
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

        document.querySelector(selector).src = src;
    }
})();
