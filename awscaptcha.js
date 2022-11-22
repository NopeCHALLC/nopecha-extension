(async () => {
    function is_widget_frame() {
        return document.querySelector('#captcha-container > #root #amzn-captcha-verify-button') !== null;
    }


    function is_image_frame() {
        return document.querySelector('#captcha-container > #root #amzn-btn-audio-internal > img[title="Audio problem"]') !== null;
    }


    function is_audio_frame() {
        return document.querySelector('#captcha-container > #root #amzn-btn-audio-internal > img[title="Visual problem"]') !== null;
    }


    async function on_widget_frame() {
        try {
            const $verify = document.querySelector('#captcha-container > #root #amzn-captcha-verify-button');
            if ($verify) {
                $verify.click();
            }
        } catch (e) {
            console.log('error on_widget_frame', e);
        }
    }


    async function on_image_frame() {
        try {
            const $e = document.querySelector('#captcha-container > #root #amzn-btn-audio-internal');
            if ($e) {
                $e.click();
            }
        } catch (e) {
            console.log('error on_image_frame', e);
        }
    }


    function get_audio_data() {
        try {
            const $audio = document.querySelector('audio');
            const data = $audio.src.replace('data:audio/aac;base64,', '');
            return data;
        } catch (e) {
            console.log('error get_audio_data', e);
        }
        return null;
    }


    let last_audio_data = null;
    function on_task_ready(i=500) {
        return new Promise(resolve => {
            let checking = false;
            const check_interval = setInterval(async () => {
                if (checking) {
                    return;
                }
                checking = true;

                const settings = await BG.exec('Settings.get');
                if (!settings.enabled || !settings.awscaptcha_auto_solve) {
                    return;
                }

                const input = document.querySelector('input[placeholder="Answer"]');
                if (!input || input.value !== '') {
                    checking = false;
                    return;
                }

                const audio_data = get_audio_data();
                if (!audio_data) {
                    checking = false;
                    return;
                }

                if (last_audio_data === audio_data) {
                    checking = false;
                    return;
                }
                last_audio_data = audio_data;

                clearInterval(check_interval);
                checking = false;
                return resolve({input, audio_data});
            }, i);
        });
    }


    async function on_audio_frame() {
        const {input, audio_data} = await on_task_ready();

        if (input === null || audio_data === null) {
            return;
        }

        const settings = await BG.exec('Settings.get');
        if (!settings.enabled || !settings.awscaptcha_auto_solve) {
            return;
        }

        const solve_start = Time.time();

        // Detect images
        const {job_id, data} = await NopeCHA.post({
            captcha_type: IS_DEVELOPMENT ? 'awscaptcha_dev' : 'awscaptcha',
            audio_data: [audio_data],
            key: settings.key,
        });
        if (!data || data.length === 0) {
            document.querySelector('#amzn-btn-refresh-internal')?.click();
            await Time.sleep(200);
            last_audio_data = null;
            return;
        }

        let delay = parseInt(settings.awscaptcha_solve_delay_time);
        delay = delay ? delay : 1000;
        const delta = settings.awscaptcha_solve_delay ? (delay - (Time.time() - solve_start)) : 0;
        if (delta > 0) {
            await Time.sleep(delta);
        }

        // Solve
        if (data[0].length === 0) {
            document.querySelector('#amzn-btn-refresh-internal')?.click();
            await Time.sleep(200);
            last_audio_data = null;
        }
        else {
            input.value = data[0];
            await Time.sleep(200);
            document.querySelector('#amzn-btn-verify-internal')?.click();
        }
    }


    while (true) {
        await Time.sleep(1000);

        const settings = await BG.exec('Settings.get');
        if (!settings || !settings.enabled) {
            continue;
        }

        const hostname = await Location.hostname();
        if (settings.disabled_hosts.includes(hostname)) {
            continue;
        }

        if (settings.awscaptcha_auto_open && is_widget_frame()) {
            await on_widget_frame();
        }
        else if (settings.hcaptcha_auto_solve && is_image_frame()) {
            await on_image_frame();
        }
        else if (settings.hcaptcha_auto_solve && is_audio_frame()) {
            await on_audio_frame();
        }
    }
})();
