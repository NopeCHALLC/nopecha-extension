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

                    const job_id = r.data;
                    return await NopeCHA.get({job_id, key});
                } catch (e) {
                    console.log('failed to parse post response', e);
                    break;
                }
            }

            return {job_id: null, results: null};
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
                            return {job_id, results: null};
                        }
                        continue;
                    }
                    return {job_id, results: r.data};
                } catch (e) {
                    console.log('failed to parse server response for solution', e);
                    break;
                }
            }

            return {job_id, results: null};
        }
    }


    function is_present(settings) {
        return document.querySelector(settings.ocr_image_selector) !== null && document.querySelector(settings.ocr_input_selector) !== null;
    }


    function get_image_url($e) {
        // Div with css background (e.g. hcaptcha)
        const matches = $e?.style['background']?.trim()?.match(/(?!^)".*?"/g);
        if (matches?.length > 0) {
            return matches[0].replaceAll('"', '');
        }

        // Img with src or data-src
        let url = $e.src || $e.dataset.src;
        if (url) {
            if (url.startsWith('/')) {
                url = `${window.location.origin}${url}`;
            }
            return url;
        }

        return null;
    }


    let last_url_hash = null;
    function on_task_ready(settings, i=100) {
        return new Promise(resolve => {
            let checking = false;
            const check_interval = setInterval(async () => {
                if (checking) {
                    return;
                }
                checking = true;

                const $image = document.querySelector(settings.ocr_image_selector);
                const image_url = get_image_url($image);
                if (!image_url || image_url === '') {
                    console.log('no image url', $image);
                    checking = false;
                    return;
                }

                const url_hash = JSON.stringify(image_url);
                if (last_url_hash === url_hash) {
                    console.log('task unchanged');
                    checking = false;
                    return;
                }
                last_url_hash = url_hash;

                clearInterval(check_interval);
                checking = false;
                return resolve({image_url});
            }, i);
        });
    }


    async function on_present(settings) {
        const {image_url} = await on_task_ready(settings);

        const solve_start = Time.time();

        // Detect images
        const {job_id, results} = await NopeCHA.post({
            captcha_type: 'ocr',
            image_urls: [image_url],
            key: settings.key,
        });
        if (!results) {
            return;
        }

        // Fill input
        if (results && results.length > 0) {
            const $input = document.querySelector(settings.ocr_input_selector);
            if ($input && !$input.value) {
                $input.value = results[0];
            }
        }
    }


    // Example site
    // https://www.projecthoneypot.org/contact_us.php
    // settings.ocr_image_selector = 'img.captchapict';
    // settings.ocr_input_selector = 'input.captcha';


    while (true) {
        await Time.sleep(1000);

        const settings = await BG.exec('get_settings');
        if (!settings) {
            continue;
        }

        if (settings.ocr_auto_solve && is_present(settings)) {
            await on_present(settings);
        }
    }
})();
