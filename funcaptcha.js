(async () => {
    function is_widget_frame() {
        const $widget_elem = document.querySelector('button[aria-describedby="descriptionVerify"]') ||
            document.querySelector('#wrong_children_button') ||
            document.querySelector('#wrongTimeout_children_button');
        return $widget_elem !== null;
    }


    function is_image_frame() {
        return get_task() !== null && get_image_data() !== null;
    }


    function on_widget_frame() {
        try {
            const $verify = document.querySelector('button[aria-describedby="descriptionVerify"]');
            if ($verify) {
                window.parent.postMessage({nopecha: true, action: 'clear'}, '*');
                $verify.click();
            }

            const $fail_incorrect = document.querySelector('#wrong_children_button');
            if ($fail_incorrect) {
                window.parent.postMessage({nopecha: true, action: 'clear'}, '*');
                $fail_incorrect.click();
            }

            const $fail_timeout = document.querySelector('#wrongTimeout_children_button');
            if ($fail_timeout) {
                window.parent.postMessage({nopecha: true, action: 'clear'}, '*');
                $fail_timeout.click();
            }
        } catch (e) {
            console.log('error on_widget_frame', e);
        }
    }


    function get_task() {
        const $task = document.querySelector('#game_children_text > h2');
        return $task?.innerText?.trim();
    }


    function get_image_data() {
        const $image = document.querySelector('img#game_challengeItem_image');
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
                if (!settings.enabled || !settings.funcaptcha_auto_solve) {
                    return;
                }

                if (settings.funcaptcha_auto_open && is_widget_frame()) {
                    await on_widget_frame(settings);
                }

                let task = get_task();
                if (!task) {
                    checking = false;
                    return;
                }

                const cells = document.querySelectorAll('#game_children_challenge ul > li > a');
                if (cells.length !== 6) {
                    checking = false;
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
                return resolve({task, cells, image_data});
            }, i);
        });
    }


    async function on_image_frame() {
        const {task, cells, image_data} = await on_task_ready();

        if (task === null || cells === null || image_data === null) {
            return;
        }

        const settings = await BG.exec('Settings.get');
        if (!settings.enabled || !settings.funcaptcha_auto_solve) {
            return;
        }

        const solve_start = Time.time();

        // Detect images
        const {job_id, data} = await NopeCHA.post({
            captcha_type: IS_DEVELOPMENT ? 'funcaptcha_dev' : 'funcaptcha',
            task: task,
            image_data: [image_data],
            key: settings.key,
        });
        if (!data) {
            last_image_data = null;
            return;
        }

        let delay = parseInt(settings.funcaptcha_solve_delay_time);
        delay = delay ? delay : 1000;
        const delta = settings.funcaptcha_solve_delay ? (delay - (Time.time() - solve_start)) : 0;
        if (delta > 0) {
            await Time.sleep(delta);
        }

        // Solve
        for (let i = 0; i < data.length; i++) {
            if (data[i] === false) {
                continue;
            }
            cells[i].click();
        }

        last_image_data = null;
    }


    if (window.location.pathname.startsWith('/fc/assets/tile-game-ui/')) {
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

            if (settings.funcaptcha_auto_open && is_widget_frame()) {
                await on_widget_frame();
            }
            else if (settings.funcaptcha_auto_solve && is_image_frame()) {
                await on_image_frame();
            }
        }
    }
})();
