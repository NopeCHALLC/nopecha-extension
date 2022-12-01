(async () => {
    function is_widget_frame() {
        return document.querySelector('.recaptcha-checkbox') !== null;
    }


    function is_image_frame() {
        return document.querySelector('.rc-imageselect-instructions') !== null;
    }


    function is_speech_frame() {
        return document.querySelector('#audio-instructions') !== null || document.querySelector('.rc-doscaptcha-header') !== null;
    }


    function open_image_frame() {
        document.querySelector('#recaptcha-anchor')?.click();
    }


    function is_solved() {
        if (got_solve_error()) {
            return false;
        }
        const is_widget_frame_solved = document.querySelector('.recaptcha-checkbox')?.getAttribute('aria-checked') === 'true';
        const is_image_frame_solved = document.querySelector('#recaptcha-verify-button')?.disabled;
        return is_widget_frame_solved || is_image_frame_solved;
    }


    function submit() {
        document.querySelector('#recaptcha-verify-button')?.click();
    }


    function got_solve_error() {
        return document.querySelector('.rc-doscaptcha-header')?.innerText === 'Try again later';
    }


    async function on_widget_frame(settings) {
        // Check if parent frame marked this frame as visible on screen
        const is_visible = await BG.exec('Cache.get', {name: 'recaptcha_widget_visible', tab_specific: true});
        if (is_visible !== true) {
            return;
        }

        // Wait if already solved
        if (is_solved()) {
            return;
        }
        await Time.sleep(500);
        open_image_frame();
    }


    async function on_image_frame(settings) {
        // Check if parent frame marked this frame as visible on screen
        const is_visible = await BG.exec('Cache.get', {name: 'recaptcha_image_visible', tab_specific: true});
        if (is_visible !== true) {
            return;
        }

        // Wait if already solved
        if (is_solved()) {
            return;
        }
        // Switch to speech
        await Time.sleep(500);
        document.querySelector('#recaptcha-audio-button')?.click();
    }


    async function on_speech_frame(settings) {
        // Check if parent frame marked this frame as visible on screen
        const is_visible = await BG.exec('Cache.get', {name: 'recaptcha_image_visible', tab_specific: true});
        if (is_visible !== true) {
            return;
        }

        // Wait if verify button is disabled
        if (is_solved()) {
            return;
        }

        // Try again later error
        if (got_solve_error()) {
            // await BG.exec('set_settings', {id: 'solve_method', value: 'image'});
            // await BG.exec('reset_recaptcha');
            return;
        }

        const dl_url = document.querySelector('.rc-audiochallenge-tdownload-link')?.href;
        const r = fetch(dl_url);

        const src_url = document.querySelector('#audio-source')?.src?.replace('recaptcha.net', 'google.com');

        let lang = document.querySelector('html')?.getAttribute('lang')?.trim();
        if (!lang || lang.length === 0) {
            lang = 'en';
        }

        const solve_start = Time.time();

        const res = await Net.fetch('https://engageub.pythonanywhere.com', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: 'input=' + encodeURIComponent(src_url) + '&lang=' + lang,
        });
        document.querySelector('#audio-response').value = res;

        let delay = parseInt(settings.recaptcha_solve_delay_time);
        delay = delay ? delay : 1000;
        const delta = settings.recaptcha_solve_delay ? (delay - (Time.time() - solve_start)) : 0;
        if (delta > 0) {
            await Time.sleep(delta);
        }

        submit();
    }


    async function check_image_frame_visibility() {
        const $image_frames = [
            ...document.querySelectorAll('iframe[src*="/recaptcha/api2/bframe"]'),
            ...document.querySelectorAll('iframe[src*="/recaptcha/enterprise/bframe"]'),
        ];
        if ($image_frames.length > 0) {
            for (const $frame of $image_frames) {
                if (window.getComputedStyle($frame).visibility === 'visible') {
                    return await BG.exec('Cache.set', {name: 'recaptcha_image_visible', value: true, tab_specific: true});
                }
            }
            await BG.exec('Cache.set', {name: 'recaptcha_image_visible', value: false, tab_specific: true});
        }
    }

    async function check_widget_frame_visibility() {
        const $widget_frames = [
            ...document.querySelectorAll('iframe[src*="/recaptcha/api2/anchor"]'),
            ...document.querySelectorAll('iframe[src*="/recaptcha/enterprise/anchor"]'),
        ];
        if ($widget_frames.length > 0) {
            for (const $frame of $widget_frames) {
                if (window.getComputedStyle($frame).visibility === 'visible') {
                    return await BG.exec('Cache.set', {name: 'recaptcha_widget_visible', value: true, tab_specific: true});
                }
            }
            await BG.exec('Cache.set', {name: 'recaptcha_widget_visible', value: false, tab_specific: true});
        }
        return false;
    }


    while (true) {
        await Time.sleep(1000);

        const settings = await BG.exec('Settings.get');

        // Using another solve method
        if (!settings || !settings.enabled || settings.recaptcha_solve_method !== 'Speech') {
            continue;
        }

        const hostname = await Location.hostname();
        if (settings.disabled_hosts.includes(hostname)) {
            continue;
        }

        await check_image_frame_visibility();
        await check_widget_frame_visibility();

        if (settings.recaptcha_auto_open && is_widget_frame()) {
            await on_widget_frame(settings);
        }
        else if (settings.recaptcha_auto_solve && is_image_frame()) {
            await on_image_frame(settings);
        }
        else if (settings.recaptcha_auto_solve && is_speech_frame()) {
            await on_speech_frame(settings);
        }
    }
})();
