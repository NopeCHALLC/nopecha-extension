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

        static async post({captcha_type, task, images, grid, key}) {
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
                    images: images,
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

                    const job_id = r.data;
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
                $verify.click();
            }

            const $fail_incorrect = document.querySelector('#wrong_children_button');
            if ($fail_incorrect) {
                $fail_incorrect.click();
            }

            const $fail_timeout = document.querySelector('#wrongTimeout_children_button');
            if ($fail_timeout) {
                $fail_timeout.click();
            }
        } catch (e) {
            console.log('error on_widget_frame', e);
        }
    }


    function get_task() {
        const $task = document.querySelector('#game_children_text > h2');
        return $task?.innerText;
    }


    function get_image() {
        const $image = document.querySelector('img#game_challengeItem_image');
        return $image?.src?.replace('data:image/jpeg;base64,', '');
    }


    let last_url = null;
    function on_task_ready(settings, i=100) {
        return new Promise(resolve => {
            let checking = false;
            const check_interval = setInterval(async () => {
                if (checking) {
                    return;
                }
                checking = true;

                if (settings.funcaptcha_auto_open && is_widget_frame()) {
                    await on_widget_frame(settings);
                }

                let task = get_task();
                if (!task) {
                    checking = false;
                    return;
                }
                // console.log('task', task);

                const cells = document.querySelectorAll('#game_children_challenge ul > li > a');
                if (cells.length !== 6) {
                    console.log('invalid number of cells', cells);
                    checking = false;
                    return;
                }

                const url = get_image();

                if (last_url === url) {
                    // console.log('task unchanged');
                    checking = false;
                    return;
                }
                last_url = url;

                clearInterval(check_interval);
                checking = false;
                return resolve({task, cells, url});
            }, i);
        });
    }


    async function on_image_frame(settings) {
        const {task, cells, url} = await on_task_ready(settings);

        const solve_start = Time.time();

        // Detect images
        const {job_id, clicks} = await NopeCHA.post({
            captcha_type: 'funcaptcha',
            task: task,
            images: [url],
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

            cells[i].click();
        }
    }


    let listeners = {};
    while (true) {
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
})();
