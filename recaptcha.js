(async () => {
    class Time {
        static time() {
            if (!Date.now)
                Date.now = () => new Date().getTime();
            return Date.now();
        }

        static sleep(i=1000) {
            return new Promise(resolve => setTimeout(resolve, i));
        }

        static async random_sleep(min, max) {
            const duration = Math.floor(Math.random() * (max - min) + min);
            return await Time.sleep(duration);
        }

        static pad(n) {
            const len = 2 - String(n).length+1;
            return len > 0 ? `${new Array(len).join('0')}${n}` : `${n}`;
        }

        static date() {
            return new Date();
        }

        static string(d=null) {
            if (!d) {
                d = Time.date();
            }
            const month = Time.pad(d.getMonth() + 1);
            const date = Time.pad(d.getDate());
            const year = d.getFullYear();
            const hours = Time.pad(d.getHours() % 12);
            const minutes = Time.pad(d.getMinutes());
            const seconds = Time.pad(d.getSeconds());
            const period = d.getHours() >= 12 ? 'PM' : 'AM';
            return `${month}/${date}/${year} ${hours}:${minutes}:${seconds} ${period}`;
        }
    }


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


    class NopeCHA {
        static INFERENCE_URL = 'https://api.nopecha.com';

        static MAX_WAIT_POST = 60;
        static MAX_WAIT_GET = 60;

        static ERRORS = {
            UNKNOWN: 9,
            INVALID_REQUEST: 10,
            RATE_LIIMTED: 11,
            BANNED_USER: 12,
            NO_JOB: 13,
            INCOMPLETE_JOB: 14,
            INVALID_KEY: 15,
            NO_CREDIT: 16,
            UPDATE_REQUIRED: 17,
        };

        static async post({captcha_type, task, image_urls, grid, key}) {
            const start_time = Date.now();

            const info = await BG.exec('info_tab');

            while (true) {
                const now = Date.now();
                if (now - start_time > NopeCHA.MAX_WAIT_POST * 1000) {
                    break;
                }

                const data = {
                    type: captcha_type,
                    task: task,
                    image_urls: image_urls,
                    v: chrome.runtime.getManifest().version,
                    key: key,
                    url: info.url,
                };
                if (grid) {
                    data.grid = grid;
                }
                const text = await Net.fetch(NopeCHA.INFERENCE_URL, {method: 'POST', body: JSON.stringify(data), headers: {'Content-Type': 'application/json'}});

                try {
                    const r = JSON.parse(text);
                    if ('error' in r) {
                        if (r.error === NopeCHA.ERRORS.RATE_LIMITED) {
                            await Time.sleep(2000);
                            continue;
                        }
                        else if (r.error === NopeCHA.ERRORS.INVALID_KEY) {
                            console.log('solve error. invalid key');
                            break;
                        }
                        else if (r.error === NopeCHA.ERRORS.NO_CREDIT) {
                            console.log('solve error. out of credit');
                            break;
                        }
                        else {
                            console.log('unknown error', r.error);
                            break
                        }
                    }

                    // API response format will change from {data} to {id} starting from v0.1.12
                    const job_id = ('id' in r) ? r.id : r.data;
                    return await NopeCHA.get({job_id, key});
                } catch (e) {
                    console.log('failed to parse post response', e);
                    break;
                }
            }

            return {job_id: null, clicks: null};
        }

        static async get({key, job_id}) {
            const start_time = Date.now();

            while (true) {
                const now = Date.now();
                if (now - start_time > NopeCHA.MAX_WAIT_GET * 1000) {
                    break;
                }

                await Time.sleep(500);
                const text = await Net.fetch(`${NopeCHA.INFERENCE_URL}?id=${job_id}&key=${key}`);
                try {
                    const r = JSON.parse(text);
                    if ('error' in r) {
                        // TODO: handle errors
                        if (r.error !== NopeCHA.ERRORS.INCOMPLETE_JOB) {
                            return {job_id, clicks: null};
                        }
                        continue;
                    }
                    return {job_id, clicks: r.data};
                } catch (e) {
                    console.log('failed to parse server response for solution', e);
                    break;
                }
            }

            return {job_id, clicks: null};
        }
    }


    // const {Time, BG, NopeCHA} = await import(chrome.runtime.getURL('utils.js'));


    function is_widget_frame() {
        return document.querySelector('.recaptcha-checkbox') !== null;
    }


    function is_image_frame() {
        return document.querySelector('#rc-imageselect') !== null;
    }


    function open_image_frame() {
        console.log('open image frame');
        document.querySelector('#recaptcha-anchor')?.click();
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


    function get_lang() {
        let lang = window.navigator.userLanguage || window.navigator.language;
        if (!lang) {
            return null;
        }
        lang = lang.toLowerCase();
        lang = lang.split('-')[0];
        return lang;
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
            console.log('error getting task', task);
            return null;
        }

        const lang = get_lang();
        if (lang && lang !== 'en') {
            task = await BG.exec('translate', {from: lang, to: 'en', text: task});
        }

        return task;
    }


    let last_urls_hash = null;
    function on_task_ready(i=100) {
        // Returns urls = [null|url] * 9 if 3x3
        // Returns urls = [null] * 16 if 4x4
        return new Promise(resolve => {
            let checking = false;
            const check_interval = setInterval(async () => {
                if (checking) {
                    return;
                }
                checking = true;

                // let task = null;
                // const task_lines = document.querySelector('.rc-imageselect-instructions')?.innerText?.split('\n');
                // if (task_lines.length > 1) {
                //     // task = task_lines[1];
                //     task = task_lines.slice(0, 2).join(' ');
                //     task = task.replace(/\s+/g, ' ')?.trim();
                // }
                // // const task = document.querySelector('.rc-imageselect-instructions')?.innerText?.replace(/\s+/g, ' ')?.trim();
                // if (!task) {
                //     console.log('no task');
                //     checking = false;
                //     return;
                // }
                // console.log('task', task);

                const task_lines = document.querySelector('.rc-imageselect-instructions')?.innerText?.split('\n');
                let task = await get_task(task_lines);
                if (!task) {
                    checking = false;
                    return;
                }
                console.log('task', task);

                // const task_lines = document.querySelector('.rc-imageselect-instructions')?.innerText?.split('\n');
                const is_hard = (task_lines.length === 3) ? true : false;

                const $cells = document.querySelectorAll('table tr td');
                if ($cells.length !== 9 && $cells.length !== 16) {
                    console.log('invalid number of cells', $cells);
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
                        console.log('no cell image', $e);
                        checking = false;
                        return;
                    }

                    const url = get_image_url($img);
                    if (!url || url === '') {
                        console.log('no cell image url', $e);
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
                    else {
                        console.log('unknown image size', $img.naturalWidth);
                    }

                    cells.push($e);
                    i++;
                }
                if (has_secondary_images) {
                    background_url = null;
                }

                const urls_hash = JSON.stringify([background_url, urls]);
                if (last_urls_hash === urls_hash) {
                    console.log('task unchanged');
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
        const errors = [
            '.rc-imageselect-error-select-more',  // select all matching images
            '.rc-imageselect-error-dynamic-more',  // also check the new images
            '.rc-imageselect-error-select-something',  // select around the object or reload
        ];
        for (const e of errors) {
            if (document.querySelector(e)?.style['display'] === '') {
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
        // Wait if already solved
        if (is_solved()) {
            if (!was_solved) {
                was_solved = true;
            }
            // Collect data
            if (settings.debug) {
                await BG.exec('reset_recaptcha');
            }
            return;
        }
        was_solved = false;
        await Time.sleep(settings.recaptcha_open_delay);
        open_image_frame();
    }


    async function on_image_frame(settings) {
        if (settings.debug) {
            await BG.exec('reload_tab', {delay: 300 * 1000, overwrite: true});
        }

        // Check if parent frame marked this frame as visible on screen
        const is_visible = await BG.exec('get_cache', {name: 'recaptcha_visible', tab_specific: true});
        if (is_visible !== true) {
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
            await BG.exec('reset_recaptcha');
            return;
        }

        // Wait for images to load
        const is_ready = await on_images_ready();
        if (!is_ready) {
            await BG.exec('reset_recaptcha');
            return;
        }

        // Wait for task to be available
        const {task, is_hard, cells, background_url, urls} = await on_task_ready();
        // console.log(task, is_hard, cells, urls);
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
        const {job_id, clicks} = await NopeCHA.post({
            captcha_type: 'recaptcha',
            task: task,
            image_urls: image_urls,
            grid: grid,
            key: settings.key,
        });
        if (!clicks) {
            return;
        }

        const delta = settings.recaptcha_solve_delay - (Time.time() - solve_start);
        if (delta > 0) {
            await Time.sleep(delta);
        }


        // Submit solution
        let n_clicks = 0;
        for (let i = 0; i < clicks.length; i++) {
            if (clicks[i] === false) {
                continue;
            }
            n_clicks++;

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

        // if ((n === 3 && result.length === 0 && images_loaded()) || n === 4) {
        if ((n === 3 && is_hard && n_clicks === 0 && await on_images_ready()) || (n === 3 && !is_hard) || n === 4) {
            await Time.sleep(200);
            submit();
        }
    }


    async function check_image_frame_visibility() {
        const $image_frames = document.querySelectorAll('iframe[src*="/bframe"]');
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


    let was_solved = false;
    let was_incorrect = false;
    let solved_urls = [];


    while (true) {
        await Time.sleep(1000);

        const settings = await BG.exec('get_settings');

        // Using another solve method
        if (!settings || settings.recaptcha_solve_method !== 'image') {
            continue;
        }

        check_image_frame_visibility();

        if (settings.recaptcha_auto_open && is_widget_frame()) {
            await on_widget_frame(settings);
        }
        else if (settings.recaptcha_auto_solve && is_image_frame()) {
            await on_image_frame(settings);
        }
    }
})();
