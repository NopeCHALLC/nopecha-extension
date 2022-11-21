(async () => {
    const KEYS = {
        'linkedin': ['3117BF26-4762-4F5A-8ED9-A85E69209A46', false],  // Pick the image that is the correct way up
        'rockstar': ['A5A70501-FCDE-4065-AF18-D9FAF06EF479', false],  // Pick the image that is the correct way up / Pick the dice pair whose top sides add up to 9
        'github': ['20782B4C-05D0-45D7-97A0-41641055B6F6', false],  // Pick the spiral galaxy
        'paypal': ['9409E63B-D2A5-9CBD-DBC0-5095707D0090', false],  // Pick one square that shows two identical objects.
        'blizzard': ['E8A75615-1CBA-5DFF-8032-D16BCF234E10', false],  // Pick the mouse that can't reach the cheese
        'twitch': ['E5554D43-23CC-1982-971D-6A2262A2CA24', false],  // Pick the dice pair whose top sides add up to 5/6/7/8
        'demo1': ['804380F4-6844-FFA1-ED4E-5877CA1F1EA4', false],  // Pick the image that is the correct way up
        'demo2': ['D39B0EE3-2973-4147-98EF-C92F93451E2D', false],  // Pick the clipart object
        // 'octocaptcha': ['69A21A01-CC7B-B9C6-0F9A-E7FA06677FFC', false],  // Pick the clipart object
        // 'outlook': ['B7D8911C-5CC8-A9A3-35B0-554ACEE604DA', false],
        // 'roblox': ['A2A14B1D-1AF3-C791-9BBC-EE33CC7A0A6F', false],
        // 'roblox': ['9F35E182-C93C-EBCC-A31D-CF8ED317B996', false],
        // 'roblox': ['476068BF-9607-4799-B53D-966BE98E2B81', false],
        'ea signup': ['73BEC076-3E53-30F5-B1EB-84F494D43DBA', false],  // Pick one square that shows two identical objects. / Pick the mouse that can reach all the cheese in the maze / Pick the matching cards
        'ea signin': ['0F5FE186-B3CA-4EDB-A39B-9B9A3397D01D', false],
        'myprepaidcenter': ['0F941BF0-7303-D94B-B76A-EAA2E2048124', false],  // Pick the image where all animals are walking in the same direction as the arrow
        'twitter': ['2CB16598-CB82-4CF7-B332-5990DB66F3AB', true],  // Pick the shadow with a different object silhouette
        'discoveryplus': ['FE296399-FDEA-2EA2-8CD5-50F6E3157ECA', false],
        'minecraft': ['D39B0EE3-2973-4147-98EF-C92F93451E2D', false],
        // 'rblxwild': ['476068BF-9607-4799-B53D-966BE98E2B81', false],
        'imvu': ['0C2B415C-D772-47D4-A183-34934F786C7E', false],
        'adobe': ['430FF2C3-1AB1-40B7-8BE7-44FC683FE02C', false],
    };
    const SRCS = {
        'outlook': ['https://iframe.arkoselabs.com/B7D8911C-5CC8-A9A3-35B0-554ACEE604DA/index.html?mkt=en', false],  // Pick the penguin
        'outlook auth': ['https://iframe-auth.arkoselabs.com/B7D8911C-5CC8-A9A3-35B0-554ACEE604DA/index.html?mkt=en', false],  // Pick one square that shows two identical objects.
    };
    const MAX_BTNS_PER_ROW = 9;

    let nframes = 18;


    reset();
    // open_all();
    // open_frame_token('ea signup', 0, nframes);
    // open_frame_token('twitter', 0, nframes);
    open_frame_token('imvu', 0, nframes);


    function reset() {
        document.body.innerHTML = '';

        const STYLES = [
            `body, html {
                background-color: #212121;
            }`,
            `.input_row {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                justify-content: center;
            }`,
            `.input_row > * {
                height: 20px;
                line-height: 20px;
                padding: 0;
                border: 0;
                font-size: 12px;
            }`,
            `.input_row > input[type="button"] {
                width: 100px;
                cursor: pointer;
                transition: 200ms all;
            }`,
            `.input_row > input[type="button"]:hover {
                opacity: 0.8;
            }`,
            `#nframes_label {
                background-color: #fff;
                color: #222;
                width: 70px;
                text-align: center;
            }`,
            `#nframes, #nframes:active {
                width: 30px;
                border: none;
                outline: none;
            }`,
            `.name {
                color: #fff;
            }`,
            `.iframe_row {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                justify-content: center;
            }`,
            // `.iframe_wrap {
            //     background-color: #eee;
            //     width: 350px;
            //     height: 300px;
            //     padding: 0;
            //     overflow: hidden;
            // }`,
            // `iframe {
            //     width: 350px;
            //     height: 300px;
            // }`,
            `.iframe_wrap {
                background-color: #eee;
                width: 275px;
                height: 275px;
                padding: 0;
                overflow: hidden;
            }`,
            `iframe {
                border: none !important;
                width: 400px !important;
                height: 400px !important;
                -ms-zoom: 0.75 !important;
                -moz-transform: scale(0.75) !important;
                -moz-transform-origin: 0 0 !important;
                -o-transform: scale(0.75) !important;
                -o-transform-origin: 0 0 !important;
                -webkit-transform: scale(0.75) !important;
                -webkit-transform-origin: 0 0 !important;
            }`,
            `iframe.small {
                width: 550px !important;
                height: 550px !important;
                -ms-zoom: 0.5 !important;
                -moz-transform: scale(0.5) !important;
                -moz-transform-origin: 0 0 !important;
                -o-transform: scale(0.5) !important;
                -o-transform-origin: 0 0 !important;
                -webkit-transform: scale(0.5) !important;
                -webkit-transform-origin: 0 0 !important;
            }`,
        ];
        const sheet = document.body.appendChild(document.createElement('style')).sheet;
        for (const i in STYLES) {
            sheet.insertRule(STYLES[i], i);
        }

        let i = 0;
        let row = 1;
        const $rows = {};

        $rows[0] = document.createElement('div');
        $rows[0].classList.add('input_row');
        document.body.append($rows[0]);

        const $nframes_label = document.createElement('div');
        $nframes_label.id = 'nframes_label';
        $nframes_label.innerText = '# iframes';
        $rows[0].append($nframes_label);

        const $nframes = document.createElement('input');
        $nframes.id = 'nframes';
        $nframes.placeholder = 'Number of iframes';
        $nframes.value = nframes;
        $nframes.addEventListener('input', () => {
            nframes = parseInt($nframes.value);
        });
        $rows[0].append($nframes);

        const BUTTONS = {
            'reset': {row: 0, fn: reset, args: []},
            'all': {row: 0, fn: open_all, args: []},
        };
        for (const k in KEYS) {
            if (i++ % MAX_BTNS_PER_ROW === 0) {
                row++;
            }
            BUTTONS[k] = {row: row, fn: open_frame_token, args: [k, 0]};
        }
        for (const k in SRCS) {
            if (i++ % MAX_BTNS_PER_ROW === 0) {
                row++;
            }
            BUTTONS[k] = {row: row, fn: open_frame_src, args: [k, 0]};
        }

        for (const [k, v] of Object.entries(BUTTONS)) {
            const row = v.row;
            if (!(v.row in $rows)) {
                $rows[v.row] = document.createElement('div');
                $rows[v.row].classList.add('input_row');
                document.body.append($rows[v.row]);
            }

            const $btn = document.createElement('input');
            $btn.type = 'button';
            $btn.value = k;
            $btn.addEventListener('click', () => {
                reset();
                v.fn(...v.args);
            });

            $rows[v.row].append($btn);
        }
    }

    function open_all() {
        open_frame_token('linkedin', 0, 1);
        open_frame_token('rockstar', 0, 1);
        open_frame_token('demo1', 0, 1);
        open_frame_token('blizzard', 0, 1);
        open_frame_token('twitch', 0, 1);
        open_frame_token('paypal', 0, 1);
        open_frame_src('outlook auth', 0, 1);
        open_frame_token('github', 0, 1);
        open_frame_token('demo2', 0, 1);
        // open_frame_token('octocaptcha', 0, 1);
        open_frame_src('outlook', 0, 1);
        open_frame_token('ea signup', 0, 1);
        open_frame_token('ea signin', 0, 1);
        // open_frame_token('myprepaidcenter', 0, 1);
        open_frame_token('twitter', 0, 1);
        // open_frame_token('discoveryplus', 0, 1);
        open_frame_token('minecraft', 0, 1);
        // open_frame_token('rblxwild', 0, 1);
        open_frame_token('imvu', 0, 1);
        open_frame_token('adobe', 0, 1);
    }

    function open_frame_token(k, row, n) {
        if (!n) {
            n = nframes;
        }
        // console.log('open_frame_token', k, n);
        for (let i = 0; i < n; i++) {
            load_captcha(k, row);
        }
    }

    function open_frame_src(k, row, n) {
        if (!n) {
            n = nframes;
        }
        // console.log('open_frame_src', k, n);
        for (let i = 0; i < n; i++) {
            create_frame(k, row, SRCS[k][0], SRCS[k][1]);
        }
    }

    function create_frame(name, row, src, is_small=false) {
        const $wrap = document.createElement('div');
        $wrap.classList.add('iframe_wrap');

        const $iframe = document.createElement('iframe');
        if (is_small) {
            $iframe.classList.add('small');
        }
        $wrap.append($iframe);
        $iframe.frameborder = 0;
        $iframe.scrolling = 'no';
        $iframe.src = src;

        let $row = document.querySelector(`#iframe_row_${row}`);
        if (!$row) {
            $row = document.createElement('div');
            $row.classList.add('iframe_row');
            $row.id = `iframe_row_${row}`;
            document.body.append($row);
        }
        const $name = document.createElement('div');
        $name.classList.add('name');
        $name.innerHTML = name;
        const $cell = document.createElement('div');
        $cell.append($name);
        $cell.append($wrap);
        $row.append($cell);
    }

    async function load_captcha(name, row) {
        const pk = KEYS[name][0];

        const host = '';
        const url = `https://api.funcaptcha.com/fc/gt2/public_key/${pk}`;
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
            "body": `bda=&public_key=${pk}&site=${encodeURIComponent(host)}&language=en&userbrowser=Mozilla%2F5.0%20(X11%3B%20Linux%20x86_64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F105.0.0.0%20Safari%2F537.36&rnd=${Math.random()}`,
            "method": "POST",
            "mode": "cors",
            "credentials": "omit"
        });

        const data = JSON.parse(r);
        // console.log('data', data);

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
        create_frame(name, row, src, KEYS[name][1]);
    }


    /**
    Manually get the iframe src from roblox.com
     */
    // const TOKEN = '400635fb675f05f61.0554348501';
    // const roblox_src = `https://roblox-api.arkoselabs.com/fc/gc/?token=${TOKEN}&r=us-east-1&metabgclr=transparent&guitextcolor=%23474747&maintxtclr=%23b8b8b8&metaiconclr=%23757575&meta=3&lang=en&pk=A2A14B1D-1AF3-C791-9BBC-EE33CC7A0A6F&at=40&ht=1&ag=101&cdn_url=https%3A%2F%2Froblox-api.arkoselabs.com%2Fcdn%2Ffc&lurl=https%3A%2F%2Faudio-us-east-1.arkoselabs.com&surl=https%3A%2F%2Froblox-api.arkoselabs.com&smurl=https%3A%2F%2Froblox-api.arkoselabs.com%2Fcdn%2Ffc%2Fassets%2Fstyle-manager`;
    // for (let i = 0; i < nframes; i++) create_frame('roblox', 0, roblox_src);

})();
