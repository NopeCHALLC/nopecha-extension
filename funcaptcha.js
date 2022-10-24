(async () => {
    function is_widget_frame() {
        const $widget_elem = document.querySelector('button[aria-describedby="descriptionVerify"]') ||
            document.querySelector('#wrong_children_button') ||
            document.querySelector('#wrongTimeout_children_button');
        return $widget_elem !== null;
    }


    function is_image_frame() {
        return get_task() !== null && get_image() !== null;
    }


    function on_widget_frame() {
        try {
            const $verify = document.querySelector('button[aria-describedby="descriptionVerify"]');
            if ($verify) {
                // console.log('verify');
                window.parent.postMessage({nopecha: true, action: 'clear'}, '*');
                $verify.click();
            }

            const $fail_incorrect = document.querySelector('#wrong_children_button');
            if ($fail_incorrect) {
                // console.log('fail_incorrect');
                window.parent.postMessage({nopecha: true, action: 'clear'}, '*');
                $fail_incorrect.click();
            }

            const $fail_timeout = document.querySelector('#wrongTimeout_children_button');
            if ($fail_timeout) {
                // console.log('fail_timeout');
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


    function get_image() {
        const $image = document.querySelector('img#game_challengeItem_image');
        // return $image?.src?.replace('data:image/jpeg;base64,', '');
        return $image?.src?.split(';base64,')[1];
    }


    let last_image_data = null;
    function on_task_ready(settings, i=100) {
        return new Promise(resolve => {
            let checking = false;
            const check_interval = setInterval(async () => {
                // console.log('checking', checking);
                if (checking) {
                    return;
                }
                checking = true;

                if (settings.funcaptcha_auto_open && is_widget_frame()) {
                    await on_widget_frame(settings);
                }

                let task = get_task();
                if (!task) {
                    // console.log('no task');
                    checking = false;
                    return;
                }
                // console.log('task', task);

                const cells = document.querySelectorAll('#game_children_challenge ul > li > a');
                if (cells.length !== 6) {
                    // console.log('invalid number of cells', cells);
                    checking = false;
                    return;
                }

                const image_data = get_image();
                if (!image_data) {
                    // console.log('no image data');
                    checking = false;
                    return;
                }

                if (last_image_data === image_data) {
                    // console.log('image_data unchanged');
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


    async function on_image_frame(settings) {
        const {task, cells, image_data} = await on_task_ready(settings);

        if (task === null || cells === null || image_data === null) {
            return;
        }

        const UNSUPPORTED_TASKS = [
            // 'Pick the image that is the correct way up',
            // 'Pick one square that shows two identical objects',
            // "Pick the mouse that can't reach the cheese",
            // 'Pick the dice pair whose top sides add up to',
            // 'Pick the image of the striped cone and the checkered cube',
            // 'Pick the image of the striped cube and the checkered cube',
            // cone, cube, heart, ball
            // 'Pick the animal looking',
        ];
        for (const e of UNSUPPORTED_TASKS) {
            if (task.startsWith(e)) {
                return;
            }
        }

        const solve_start = Time.time();

        // Detect images
        const {job_id, data} = await NopeCHA.post({
            captcha_type: 'funcaptcha',
            // captcha_type: 'test',
            task: task,
            image_data: [image_data],
            key: settings.key,
        });
        if (!data) {
            last_image_data = null;
            return;
        }

        const delta = settings.hcaptcha_solve_delay - (Time.time() - solve_start);
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
            // console.log('window.location.href', window.location.href);
            await Time.sleep(1000);

            const settings = await BG.exec('get_settings');
            if (!settings) {
                continue;
            }

            if (settings.funcaptcha_auto_open && is_widget_frame()) {
                await on_widget_frame(settings);
            }
            else if (settings.funcaptcha_auto_solve && is_image_frame()) {
                await on_image_frame(settings);
            }
        }
    }
})();
