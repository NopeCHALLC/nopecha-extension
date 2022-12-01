(async () => {
    function is_widget_frame() {
        return document.querySelector('.recaptcha-checkbox') !== null;
    }


    function is_image_frame() {
        return document.querySelector('#rc-imageselect') !== null;
    }


    function open_image_frame() {
        document.querySelector('#recaptcha-anchor')?.click();
    }


    function is_invalid_config() {
        return document.querySelector('.rc-anchor-error-message') !== null;
    }


    function is_rate_limited() {
        return document.querySelector('.rc-doscaptcha-header') !== null;
    }


    function is_solved() {
        const is_widget_frame_solved = document.querySelector('.recaptcha-checkbox')?.getAttribute('aria-checked') === 'true';
        // Note: verify button is disabled after clicking and during transition to the next image task
        const is_image_frame_solved = document.querySelector('#recaptcha-verify-button')?.disabled;
        return is_widget_frame_solved || is_image_frame_solved;
    }


    function on_images_ready(timeout=15000) {
        return new Promise(async resolve => {
            const start = Time.time();
            while (true) {
                const $tiles = document.querySelectorAll('.rc-imageselect-tile');
                const $loading = document.querySelectorAll('.rc-imageselect-dynamic-selected');
                const is_loaded = $tiles.length > 0 && $loading.length === 0;
                if (is_loaded) {
                    return resolve(true);
                }
                if ((Time.time() - start) > timeout) {
                    return resolve(false);
                }
                await Time.sleep(100);
            }
        });
    }


    function get_image_url($e) {
        return $e?.src?.trim();
    }


    async function get_task(task_lines) {
        let task = null;
        if (task_lines.length > 1) {
            // task = task_lines[1];
            task = task_lines.slice(0, 2).join(' ');
            task = task.replace(/\s+/g, ' ')?.trim();
        }
        else {
            task = task.join('\n');
        }
        if (!task) {
            return null;
        }
        return task;
    }


    let last_urls_hash = null;
    function on_task_ready(i=500) {
        return new Promise(resolve => {
            let checking = false;
            const check_interval = setInterval(async () => {
                if (checking) {
                    return;
                }
                checking = true;

                const task_lines = document.querySelector('.rc-imageselect-instructions')?.innerText?.split('\n');
                let task = await get_task(task_lines);
                if (!task) {
                    checking = false;
                    return;
                }

                const is_hard = (task_lines.length === 3) ? true : false;

                const $cells = document.querySelectorAll('table tr td');
                if ($cells.length !== 9 && $cells.length !== 16) {
                    checking = false;
                    return;
                }

                const cells = [];
                const urls = Array($cells.length).fill(null);
                let background_url = null;
                let has_secondary_images = false;
                let i = 0;
                for (const $e of $cells) {
                    const $img = $e?.querySelector('img');
                    if (!$img) {
                        checking = false;
                        return;
                    }

                    const url = get_image_url($img);
                    if (!url || url === '') {
                        checking = false;
                        return;
                    }

                    if ($img.naturalWidth >= 300) {
                        background_url = url;
                    }
                    else if ($img.naturalWidth == 100) {
                        urls[i] = url;
                        has_secondary_images = true;
                    }

                    cells.push($e);
                    i++;
                }
                if (has_secondary_images) {
                    background_url = null;
                }

                const urls_hash = JSON.stringify([background_url, urls]);
                if (last_urls_hash === urls_hash) {
                    checking = false;
                    return;
                }
                last_urls_hash = urls_hash;

                clearInterval(check_interval);
                checking = false;
                return resolve({task, is_hard, cells, background_url, urls});
            }, i);
        });
    }


    function submit() {
        document.querySelector('#recaptcha-verify-button')?.click();
    }


    function got_solve_incorrect() {
        const errors = [
            '.rc-imageselect-incorrect-response',  // try again
        ];
        for (const e of errors) {
            if (document.querySelector(e)?.style['display'] === '') {
                return true;
            }
        }
        return false;
    }


    function got_solve_error() {
        // <div aria-live="polite">
        //     <div class="rc-imageselect-error-select-more" style="" tabindex="0">Please select all matching images.</div>
        //     <div class="rc-imageselect-error-dynamic-more" style="display:none">Please also check the new images.</div>
        //     <div class="rc-imageselect-error-select-something" style="display:none">Please select around the object, or reload if there are none.</div>
        // </div>

        const errors = [
            '.rc-imageselect-error-select-more',  // select all matching images
            '.rc-imageselect-error-dynamic-more',  // please also check the new images
            '.rc-imageselect-error-select-something',  // select around the object or reload
        ];
        for (const e of errors) {
            const $e = document.querySelector(e);
            if ($e?.style['display'] === '' || $e?.tabIndex === 0) {
                return true;
            }
        }
        return false;
    }


    function is_cell_selected($cell) {
        try {
            return $cell.classList.contains('rc-imageselect-tileselected');
        } catch {}
        return false;
    }


    async function on_widget_frame(settings) {
        // Check if parent frame marked this frame as visible on screen
        const is_visible = await BG.exec('Cache.get', {name: 'recaptcha_widget_visible', tab_specific: true});
        if (is_visible !== true) {
            return;
        }

        // Wait if already solved
        if (is_solved()) {
            if (!was_solved) {
                was_solved = true;
            }
            return;
        }
        was_solved = false;
        await Time.sleep(500);
        open_image_frame();
    }


    async function on_image_frame() {
        // Check if parent frame marked this frame as visible on screen
        const is_visible = await BG.exec('Cache.get', {name: 'recaptcha_image_visible', tab_specific: true});
        if (is_visible !== true) {
            return;
        }

        if (is_rate_limited()) {
            console.log('rate limited');
            return;
        }

        // Wait if verify button is disabled
        if (is_solved()) {
            return;
        }

        // Incorrect solution
        if (!was_incorrect && got_solve_incorrect()) {
            solved_urls = [];
            was_incorrect = true;
        }
        else {
            was_incorrect = false;
        }

        // Select more images error
        if (got_solve_error()) {
            solved_urls = [];
            // await BG.exec('reset_recaptcha');
            return;
        }

        // Wait for images to load
        const is_ready = await on_images_ready();
        if (!is_ready) {
            // await BG.exec('reset_recaptcha');
            return;
        }

        // Wait for task to be available
        const {task, is_hard, cells, background_url, urls} = await on_task_ready();

        const settings = await BG.exec('Settings.get');
        if (!settings.enabled || !settings.recaptcha_auto_solve) {
            return;
        }

        const n = cells.length == 9 ? 3 : 4;

        const image_urls = [];
        let grid;
        let clickable_cells = [];  // Variable number of clickable cells if secondary images appear
        if (background_url === null) {
            grid = '1x1';  // Grid len (1x1 for secondary images)
            for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                const cell = cells[i];
                if (url && !solved_urls.includes(url)) {
                    image_urls.push(url);
                    clickable_cells.push(cell);
                }
            }
        }
        else {
            image_urls.push(background_url);
            grid = `${n}x${n}`;
            clickable_cells = cells;
        }

        const solve_start = Time.time();

        // Solve task
        const {job_id, data} = await NopeCHA.post({
            captcha_type: IS_DEVELOPMENT ? 'recaptcha_dev' : 'recaptcha',
            task: task,
            image_urls: image_urls,
            grid: grid,
            key: settings.key,
        });
        if (!data) {
            return;
        }

        let delay = parseInt(settings.recaptcha_solve_delay_time);
        delay = delay ? delay : 1000;
        const delta = settings.recaptcha_solve_delay ? (delay - (Time.time() - solve_start)) : 0;
        if (delta > 0) {
            await Time.sleep(delta);
        }

        // Submit solution
        let clicks = 0;
        for (let i = 0; i < data.length; i++) {
            if (data[i] === false) {
                continue;
            }
            clicks++;

            // Click if not already selected
            if (!is_cell_selected(clickable_cells[i])) {
                clickable_cells[i]?.click();
            }
        }

        for (const url of urls) {
            solved_urls.push(url);
            if (solved_urls.length > 9) {
                solved_urls.shift();
            }
        }

        if ((n === 3 && is_hard && clicks === 0 && await on_images_ready()) || (n === 3 && !is_hard) || n === 4) {
            await Time.sleep(200);
            submit();
        }
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


    let was_solved = false;
    let was_incorrect = false;
    let solved_urls = [];


    while (true) {
        await Time.sleep(1000);

        const settings = await BG.exec('Settings.get');
        if (!settings || !settings.enabled || settings.recaptcha_solve_method !== 'Image') {
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
            await on_image_frame();
        }

        // if (is_invalid_config()) {
        //     console.log('invalid config');
        //     window.postMessage({event: 'NOPECHA', status: 'invalid_config'}, '*');
        //     // return;
        // }
        // if (is_rate_limited()) {
        //     console.log('rate limited');
        //     window.postMessage({event: 'NOPECHA', status: 'rate_limited'}, '*');
        //     // return;
        // }
    }
})();
