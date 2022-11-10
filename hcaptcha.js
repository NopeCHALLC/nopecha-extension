(async () => {
    function is_widget_frame() {
        if (document.body.getBoundingClientRect()?.width === 0 || document.body.getBoundingClientRect()?.height === 0) {
            return false;
        }
        return document.querySelector('div.check') !== null;
    }


    function is_image_frame() {
        return document.querySelector('h2.prompt-text') !== null;
    }


    function open_image_frame() {
        document.querySelector('#checkbox')?.click();
    }


    function is_solved() {
        const is_widget_frame_solved = document.querySelector('div.check')?.style['display'] === 'block';
        return is_widget_frame_solved;
    }


    function get_image_url($e) {
        const matches = $e?.style['background']?.trim()?.match(/(?!^)".*?"/g);
        if (!matches || matches.length === 0) {
            return null;
        }
        return matches[0].replaceAll('"', '');
    }


    async function get_task() {
        let task = document.querySelector('h2.prompt-text')?.innerText?.replace(/\s+/g, ' ')?.trim();
        if (!task) {
            return null;
        }

        const CODE = {
            '0430': 'a',
            '0441': 'c',
            '0501': 'd',
            '0065': 'e',
            '0435': 'e',
            '04bb': 'h',
            '0069': 'i',
            '0456': 'i',
            '0458': 'j',
            '03f3': 'j',
            '04cf': 'l',
            '03bf': 'o',
            '043e': 'o',
            '0440': 'p',
            '0455': 's',
            '0445': 'x',
            '0443': 'y',
            '0335': '-',
        };

        function pad_left(s, char, n) {
            while (`${s}`.length < n) {
                s = `${char}${s}`;
            }
            return s;
        }

        const new_task = [];
        for (const e of task) {
            const k = pad_left(e.charCodeAt(0).toString(16), '0', 4);
            if (k in CODE) {
                new_task.push(CODE[k]);
            }
            else {
                new_task.push(e);
            }
        }
        return new_task.join('');
    }


    let last_urls_hash = null;
    function on_task_ready(i=200) {
        return new Promise(resolve => {
            let checking = false;
            const check_interval = setInterval(async () => {
                if (checking) {
                    return;
                }
                checking = true;

                let task = await get_task();
                if (!task) {
                    checking = false;
                    return;
                }

                const $task_image = document.querySelector('.challenge-example > .image > .image');
                const task_url = get_image_url($task_image);
                if (!task_url || task_url === '') {
                    checking = false;
                    return;
                }

                const $cells = document.querySelectorAll('.task-image');
                if ($cells.length !== 9) {
                    checking = false;
                    return;
                }

                const cells = [];
                const urls = [];
                for (const $e of $cells) {
                    const $img = $e.querySelector('div.image');
                    if (!$img) {
                        checking = false;
                        return;
                    }

                    const url = get_image_url($img);
                    if (!url || url === '') {
                        checking = false;
                        return;
                    }

                    cells.push($e);
                    urls.push(url);
                }

                const urls_hash = JSON.stringify(urls);
                if (last_urls_hash === urls_hash) {
                    checking = false;
                    return;
                }
                last_urls_hash = urls_hash;

                clearInterval(check_interval);
                checking = false;
                return resolve({task, task_url, cells, urls});
            }, i);
        });
    }


    function got_solve_incorrect() {
        const $error = document.querySelector('.display-error');
        return $error?.getAttribute('aria-hidden') !== 'true';
    }


    function submit() {
        try {
            document.querySelector('.button-submit').click();
        } catch (e) {
            console.error('error submitting', e);
        }
    }


    function is_cell_selected($cell) {
        return $cell.getAttribute('aria-pressed') === 'true';
    }


    async function on_widget_frame(settings) {
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
        if (document.querySelector('.display-language .text').textContent !== 'EN') {
            document.querySelector('.language-selector .option:nth-child(23)').click();
            await Time.sleep(500);
        }

        const {task, task_url, cells, urls} = await on_task_ready();

        const settings = await BG.exec('get_settings');
        if (!settings.enabled || !settings.hcaptcha_auto_solve) {
            return;
        }

        const solve_start = Time.time();

        // Detect images
        const {job_id, data} = await NopeCHA.post({
            captcha_type: IS_DEVELOPMENT ? 'hcaptcha_dev' : 'hcaptcha',
            task: task,
            image_urls: urls,
            key: settings.key,
        });
        if (!data) {
            return;
        }

        const delta = settings.hcaptcha_solve_delay ? (3000 - (Time.time() - solve_start)) : 0;
        if (delta > 0) {
            await Time.sleep(delta);
        }

        // Solve
        for (let i = 0; i < data.length; i++) {
            if (data[i] === false) {
                continue;
            }

            // Click if not already selected
            if (!is_cell_selected(cells[i])) {
                cells[i].click();
            }
        }

        await Time.sleep(200);
        submit();
    }


    let was_solved = false;


    while (true) {
        await Time.sleep(1000);

        const settings = await BG.exec('get_settings');
        if (!settings || !settings.enabled) {
            continue;
        }

        if (settings.hcaptcha_auto_open && is_widget_frame()) {
            await on_widget_frame(settings);
        }
        else if (settings.hcaptcha_auto_solve && is_image_frame()) {
            await on_image_frame();
        }
    }
})();
