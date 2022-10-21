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
        'demo1': '69A21A01-CC7B-B9C6-0F9A-E7FA06677FFC',
        'demo2': 'D39B0EE3-2973-4147-98EF-C92F93451E2D',
        'demo3': '804380F4-6844-FFA1-ED4E-5877CA1F1EA4',
        'github': '20782B4C-05D0-45D7-97A0-41641055B6F6',
        // 'roblox': 'A2A14B1D-1AF3-C791-9BBC-EE33CC7A0A6F',
        // 'roblox': '9F35E182-C93C-EBCC-A31D-CF8ED317B996',
        // 'roblox': '476068BF-9607-4799-B53D-966BE98E2B81',
        'paypal': '9409E63B-D2A5-9CBD-DBC0-5095707D0090',
        'blizzard': 'E8A75615-1CBA-5DFF-8032-D16BCF234E10',
        'linkedin': '3117BF26-4762-4F5A-8ED9-A85E69209A46',
        'twitch': 'E5554D43-23CC-1982-971D-6A2262A2CA24',
        'outlook': 'B7D8911C-5CC8-A9A3-35B0-554ACEE604DA',
        'rockstar': 'A5A70501-FCDE-4065-AF18-D9FAF06EF479',
    };

    const n = 5;
    // load_captcha(KEYS['roblox'], 'https://www.roblox.com', '#frames0', n);
    load_captcha(KEYS['blizzard'], 'https://account.battle.net', '#frames0', 1);
    load_captcha(KEYS['twitch'], 'https://www.twitch.com', '#frames0', 1);
        load_captcha(KEYS['demo3'], 'https://www.funcaptcha.com', '#frames0', 1);
    load_captcha(KEYS['paypal'], 'https://www.paypal.com', '#frames1', 1);
    document.querySelector('#frames1').append(create_frame(`https://iframe-auth.arkoselabs.com/${KEYS['outlook']}/index.html?mkt=en`));
        load_captcha(KEYS['demo3'], 'https://www.funcaptcha.com', '#frames1', 1);
    // load_captcha(KEYS['demo3'], 'https://www.funcaptcha.com', '#frames2', 1);
    // load_captcha(KEYS['linkedin'], 'https://linkedin-api.arkoselabs.com', '#frames2', 1);
    // load_captcha(KEYS['rockstar'], 'https://rockstar-api.arkoselabs.com', '#frames2', 1);
    load_captcha(KEYS['github'], 'https://www.github.com', '#frames3', 1);
    document.querySelector('#frames3').append(create_frame(`https://iframe.arkoselabs.com/${KEYS['outlook']}/index.html`));
    load_captcha(KEYS['demo1'], 'https://www.funcaptcha.com', '#frames3', 1);
    load_captcha(KEYS['demo2'], 'https://www.funcaptcha.com', '#frames3', 1);

    /**
    Pick the spiral galaxy
     */
    // load_captcha(KEYS['github'], 'https://www.github.com', '#frames0', n);

    /**
    Pick the dice pair whose top sides add up to 8
    Timeout after ~1min inactivity
     */
    // load_captcha(KEYS['twitch'], 'https://www.twitch.com', '#frames0', 2);
    // load_captcha(KEYS['twitch'], 'https://www.twitch.com', '#frames0', n);
    // load_captcha(KEYS['twitch'], 'https://www.twitch.com', '#frames1', n);
    // load_captcha(KEYS['twitch'], 'https://www.twitch.com', '#frames2', n);
    // load_captcha(KEYS['twitch'], 'https://www.twitch.com', '#frames3', n);

    /**
    Pick one square that shows two identical objects.
     */
    // load_captcha(KEYS['paypal'], 'https://www.paypal.com', '#frames0', n);
    // load_captcha(KEYS['paypal'], 'https://www.paypal.com', '#frames1', n);
    // load_captcha(KEYS['paypal'], 'https://www.paypal.com', '#frames2', n);
    // load_captcha(KEYS['paypal'], 'https://www.paypal.com', '#frames3', n);

    /**
    Pick the clipart object
     */
    // load_captcha(KEYS['demo1'], 'https://www.funcaptcha.com', '#frames0', n);

    /**
    Pick the clipart object
     */
    // load_captcha(KEYS['demo2'], 'https://www.funcaptcha.com', '#frames0', n);

    /**
    Pick the image that is the correct way up
     */
    // load_captcha(KEYS['demo3'], 'https://www.funcaptcha.com', '#frames0', n);


    /**
    Pick the mouse that can't reach the cheese
    */
    // load_captcha(KEYS['blizzard'], 'https://account.battle.net', '#frames0', n);
    // load_captcha(KEYS['blizzard'], 'https://account.battle.net', '#frames1', n);
    // load_captcha(KEYS['blizzard'], 'https://account.battle.net', '#frames2', n);
    // load_captcha(KEYS['blizzard'], 'https://account.battle.net', '#frames3', n);

    /**
    Pick the image that is the correct way up
    */
    // load_captcha(KEYS['linkedin'], 'https://linkedin-api.arkoselabs.com', '#frames0', n);

    /**
    Pick the image that is the correct way up
     */
    // load_captcha(KEYS['rockstar'], 'https://rockstar-api.arkoselabs.com', '#frames0', n);

    /**
    Pick the penguin
     */
    // for (let i = 0; i < n; i++) document.querySelector('#frames0').append(create_frame(`https://iframe.arkoselabs.com/${KEYS['outlook']}/index.html`));

    /**
    Pick one square that shows two identical objects.
     */
    // for (let i = 0; i < n; i++) document.querySelector('#frames0').append(create_frame(`https://iframe-auth.arkoselabs.com/${KEYS['outlook']}/index.html?mkt=en`));

//     const roblox_src = `
// https://roblox-api.arkoselabs.com/fc/gc/?token=5036352429656edd7.4562872101&r=us-east-1&metabgclr=transparent&guitextcolor=%23474747&maintxtclr=%23b8b8b8&metaiconclr=%23757575&meta=3&lang=en&pk=A2A14B1D-1AF3-C791-9BBC-EE33CC7A0A6F&at=40&ht=1&ag=101&cdn_url=https%3A%2F%2Froblox-api.arkoselabs.com%2Fcdn%2Ffc&lurl=https%3A%2F%2Faudio-us-east-1.arkoselabs.com&surl=https%3A%2F%2Froblox-api.arkoselabs.com&smurl=https%3A%2F%2Froblox-api.arkoselabs.com%2Fcdn%2Ffc%2Fassets%2Fstyle-manager
//     `.trim();
//     // for (let i = 0; i < 2; i++) document.querySelector('#frames0').append(create_frame(roblox_src));
//     for (let i = 0; i < n; i++) document.querySelector('#frames0').append(create_frame(roblox_src));
//     for (let i = 0; i < n; i++) document.querySelector('#frames1').append(create_frame(roblox_src));
//     for (let i = 0; i < n; i++) document.querySelector('#frames2').append(create_frame(roblox_src));
//     for (let i = 0; i < n; i++) document.querySelector('#frames3').append(create_frame(roblox_src));

    // const html = `
    // <script ec-api-script="true" type="text/javascript" async="" src="https://roblox-api.arkoselabs.com/cdn/fc/js/7f648daea2c51c851d54e43a70239500dbd022c3/standard/funcaptcha_api.js"></script>
    // <script src="https://roblox-api.arkoselabs.com/fc/api/?onload=reportFunCaptchaLoaded" async="" onerror="Roblox.BundleDetector &amp;&amp; Roblox.BundleDetector.reportResourceError('funcaptcha')"></script>
    // <script type="text/javascript">
    //     var Roblox = Roblox || {};
    //     $(function () {
    //         var funCaptcha = Roblox.FunCaptcha;
    //         if (funCaptcha) {
    //             var captchaTypes = [{"Type":"Signup","PublicKey":"A2A14B1D-1AF3-C791-9BBC-EE33CC7A0A6F","ApiUrl":"https://captcha.roblox.com/v1/funcaptcha/signup"},{"Type":"Login","PublicKey":"9F35E182-C93C-EBCC-A31D-CF8ED317B996","ApiUrl":"https://captcha.roblox.com/v1/funcaptcha/login/web"}];
    //             funCaptcha.addCaptchaTypes(captchaTypes, true);
    //             funCaptcha.setMaxRetriesOnTokenValidationFailure(0);
    //             funCaptcha.setPerAppTypeLoggingEnabled(false);
    //             funCaptcha.setRetryIntervalRange(500, 1500);
    //         }
    //     });
    //     // Necessary because of how FunCaptcha js executes callback
    //     // i.e. window["{function name}"]
    //     function reportFunCaptchaLoaded()
    //     {
    //         if (Roblox.BundleDetector)
    //         {
    //             Roblox.BundleDetector.reportResourceLoaded("funcaptcha");
    //         }
    //     }
    // </script>
    // `;
    // document.body.insertAdjacentHTML('beforeend', html);


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
