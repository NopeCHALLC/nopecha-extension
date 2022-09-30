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


    function get_lang() {
        let lang = document.querySelector('.display-language .text').innerText || window.navigator.userLanguage || window.navigator.language;
        if (!lang) {
            return null;
        }
        lang = lang.toLowerCase();
        lang = lang.split('-')[0];
        return lang;
    }


    async function get_task() {
        let task = document.querySelector('h2.prompt-text')?.innerText?.replace(/\s+/g, ' ')?.trim();
        if (!task) {
            console.log('error getting task', task);
            return null;
        }

        const CODE = {
            '0430': 'a',
            '0441': 'c',
            '0501': 'd',
            '0435': 'e',
            '04bb': 'h',
            '0456': 'i',
            '0458': 'j',
            '04cf': 'l',
            '03bf': 'o',
            '043e': 'o',
            '0440': 'p',
            '0455': 's',
            '0445': 'x',
            '0443': 'y',

            '03bf': 'o',
            '04bb': 'h',
            '0065': 'e',
            '0069': 'i',
            '0430': 'a',
            '0435': 'e',
            '0440': 'p',
            '0441': 'c',
            '0443': 'y',
            '0455': 's',
            '0456': 'i',
            '0501': 'd',
            '30fc': '一',
            '571f': '士',
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
        task = new_task.join('');

        const lang = get_lang();
        if (lang && lang !== 'en') {
            task = await BG.exec('translate', {from: lang, to: 'en', text: task});
        }

        return task;
    }


    let last_urls_hash = null;
    function on_task_ready(i=100) {
        return new Promise(resolve => {
            let checking = false;
            const check_interval = setInterval(async () => {
                if (checking) {
                    return;
                }
                checking = true;

                // let task = document.querySelector('h2.prompt-text')?.innerText?.replace('Please click each image containing', '')?.trim();
                // const task = document.querySelector('h2.prompt-text')?.innerText.trim();
                // let task = document.querySelector('h2.prompt-text')?.innerText?.replace(/\s+/g, ' ')?.trim();
                let task = await get_task();
                if (!task) {
                    checking = false;
                    return;
                }
                console.log('task', task);

                const $task_image = document.querySelector('.challenge-example > .image > .image');
                const task_url = get_image_url($task_image);
                if (!task_url || task_url === '') {
                    console.log('no task image url', $task_image);
                    checking = false;
                    return;
                }

                const $cells = document.querySelectorAll('.task-image');
                if ($cells.length !== 9) {
                    console.log('invalid number of cells', $cells);
                    checking = false;
                    return;
                }

                const cells = [];
                const urls = [];
                for (const $e of $cells) {
                    const $img = $e.querySelector('div.image');
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

                    cells.push($e);
                    urls.push(url);
                }

                const urls_hash = JSON.stringify(urls);
                if (last_urls_hash === urls_hash) {
                    console.log('task unchanged');
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
            console.log('error submitting', e);
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
            // Refresh page to collect samples
            if (settings.debug) {
                window.location.reload();
            }
            return;
        }
        was_solved = false;
        await Time.sleep(settings.hcaptcha_open_delay);
        open_image_frame();
    }


    async function on_image_frame(settings) {
        // Failed stat
        if (!was_incorrect && got_solve_incorrect()) {
            was_incorrect = true;
            // // window.location.reload();
            // document.querySelector('.refresh')?.click();
            // await Time.sleep(500);
        }
        else {
            was_incorrect = false;
        }

        const {task, task_url, cells, urls} = await on_task_ready();

        const solve_start = Time.time();

        // Detect images
        const {job_id, clicks} = await NopeCHA.post({
            captcha_type: 'hcaptcha',
            task: task,
            image_urls: urls,
            key: settings.key,
        });
        if (!clicks) {
            return;
        }

        const delta = settings.hcaptcha_solve_delay - (Time.time() - solve_start);
        if (delta > 0) {
            await Time.sleep(delta);
        }

        // Solve
        for (let i = 0; i < clicks.length; i++) {
            if (clicks[i] === false) {
                continue;
            }

            // Click if not already selected
            if (!is_cell_selected(cells[i])) {
                cells[i].click();
            }
        }

        submit();
    }


    let was_solved = false;
    let was_incorrect = false;


    while (true) {
        await Time.sleep(1000);

        const settings = await BG.exec('get_settings');
        if (!settings) {
            continue;
        }

        if (settings.hcaptcha_auto_open && is_widget_frame()) {
            await on_widget_frame(settings);
        }
        else if (settings.hcaptcha_auto_solve && is_image_frame()) {
            await on_image_frame(settings);
        }
    }
})();
