(async () => {
    function is_widget_frame() {
        return document.querySelector('.yidun_tips') !== null;
    }

    function is_image_frame() {
        return document.querySelector('.yidun_bg-img') !== null;
    }

    function get_image_data() {
        const $image = document.querySelector('.yidun_bg-img');
        return $image?.src?.split(';base64,')[1];
    }

    let last_image_data = null;
    function on_task_ready(i=500) {
        return new Promise(resolve => {
            let checking = false;
            const check_interval = setInterval(async () => {
                if (checking) {
                    return;
                }
                checking = true;

                const settings = await BG.exec('Settings.get');
                if (!settings.enabled || !settings.yidun_captcha_auto_solve) {
                    return;
                }

                const image_data = get_image_data();
                if (!image_data) {
                    checking = false;
                    return;
                }

                if (last_image_data === image_data) {
                    checking = false;
                    return;
                }
                last_image_data = image_data;

                clearInterval(check_interval);
                checking = false;
                return resolve({image_data});
            }, i);
        });
    }

    async function on_image_frame() {
        const {image_data} = await on_task_ready();

        if (image_data === null) {
            return;
        }

        const settings = await BG.exec('Settings.get');
        if (!settings.enabled || !settings.yidun_captcha_auto_solve) {
            return;
        }

        const solve_start = Time.time();

        // Detect images
        const {job_id, data} = await NopeCHA.post({
            captcha_type: IS_DEVELOPMENT ? 'yidun_captcha_dev' : 'yidun_captcha',
            image_data: [image_data],
            key: settings.key,
        });
        if (!data) {
            last_image_data = null;
            return;
        }

        let delay = parseInt(settings.yidun_captcha_solve_delay_time);
        delay = delay ? delay : 1000;
        const delta = settings.yidun_captcha_solve_delay ? (delay - (Time.time() - solve_start)) : 0;
        if (delta > 0) {
            await Time.sleep(delta);
        }

        // Solve
        if (data[0].length === 0) {
            document.querySelector('.yidun_refresh')?.click();
            await Time.sleep(200);
            last_image_data = null;
        }
        else {
            const $input = document.querySelector('.yidun_input');
            $input.value = data[0];
            await Time.sleep(200);
            document.querySelector('.yidun_submit')?.click();
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

        if (settings.yidun_captcha_auto_open && is_widget_frame()) {
            await on_widget_frame();
        }
        else if (settings.yidun_captcha_auto_solve && is_image_frame()) {
            await on_image_frame();
        }
    }
})();
