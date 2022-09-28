(async () => {
    const DEFAULT_SLEEP = [200, 400];


    const {Logger, Time, BG, Net} = await import(chrome.runtime.getURL('utils.js'));


    function is_widget_frame() {
        return document.querySelector('.recaptcha-checkbox') !== null;
    }


    function is_image_frame() {
        return document.querySelector('.rc-imageselect-instructions') !== null;
    }


    function is_voice_frame() {
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
        // Wait if already solved
        if (is_solved()) {
            return;
        }
        await Time.sleep(settings.recaptcha_open_delay);
        open_image_frame();
    }


    async function on_image_frame(settings) {
        // Check if parent frame marked this frame as visible on screen
        const is_visible = await BG.exec('get_cache', {name: 'recaptcha_visible', tab_specific: true});
        if (is_visible !== true) {
            return;
        }

        // Wait if already solved
        if (is_solved()) {
            return;
        }
        // Switch to voice
        await Time.sleep(settings.recaptcha_open_delay);
        document.querySelector('#recaptcha-audio-button')?.click();
    }


    async function on_voice_frame(settings) {
        // Check if parent frame marked this frame as visible on screen
        const is_visible = await BG.exec('get_cache', {name: 'recaptcha_visible', tab_specific: true});
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
            Logger.log('got solve error');
            await BG.exec('reset_recaptcha');
            return;
        }

        const dl_url = document.querySelector('.rc-audiochallenge-tdownload-link')?.href;
        const r = fetch(dl_url);

        await Time.random_sleep(...DEFAULT_SLEEP);

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

        const delta = settings.recaptcha_solve_delay - (Time.time() - solve_start);
        if (delta > 0) {
            await Time.sleep(delta);
        }

        await Time.random_sleep(...DEFAULT_SLEEP);

        submit();
    }


    async function check_image_frame_visibility() {
        const $image_frames = document.querySelectorAll('iframe[src*="/recaptcha/api2/bframe"]');
        if ($image_frames.length > 0) {
            let is_visible = false;
            for (const $image_frame of $image_frames) {
                is_visible = window.getComputedStyle($image_frame).visibility === 'visible';
                if (is_visible) {
                    break;
                }
            }
            if (is_visible) {
                await BG.exec('set_cache', {name: 'recaptcha_visible', value: true, tab_specific: true});
            }
            else {
                await BG.exec('set_cache', {name: 'recaptcha_visible', value: false, tab_specific: true});
            }
        }
    }


    while (true) {
        await Time.sleep(1000);

        const settings = await BG.exec('get_settings');

        // Using another solve method
        if (!settings || settings.recaptcha_solve_method !== 'voice') {
            continue;
        }
        Logger.debug = settings.debug;

        check_image_frame_visibility();

        if (settings.recaptcha_auto_open && is_widget_frame()) {
            await on_widget_frame(settings);
        }
        else if (settings.recaptcha_auto_solve && is_image_frame()) {
            await on_image_frame(settings);
        }
        else if (settings.recaptcha_auto_solve && is_voice_frame()) {
            await on_voice_frame(settings);
        }
    }
})();
