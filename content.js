class BG {
    static exec(method, data) {
        return new Promise(resolve => {
            try {
                chrome.runtime.sendMessage({method, data}, resolve);
            } catch (e) {
                // console.log('exec failed', e);
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


class Image {
    static encode(url) {
        return new Promise(resolve => {
            if (url === null) {
                return resolve(null);
            }

            const xhr = new XMLHttpRequest();
            xhr.onload = () => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    let res = reader.result;
                    if (res.startsWith('data:text/html;base64,')) {
                        return resolve(null);
                    }
                    res = res.replace('data:image/jpeg;base64,', '');
                    resolve(res);
                };
                reader.readAsDataURL(xhr.response);
            };
            xhr.onerror = () => {
                resolve(null);
            };
            xhr.onreadystatechange = () => {
                if (this.readyState == 4 && this.status != 200) {
                    resolve(null);
                }
            };
            xhr.open('GET', url);
            xhr.responseType = 'blob';
            xhr.send();
        });
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

    static async post({captcha_type, task, image_urls, image_data, grid, key}) {
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
                v: chrome.runtime.getManifest().version,
                key: key,
                url: info ? info.url : window.location.href,
            };
            if (image_urls) {
                data.image_urls = image_urls;
            }
            if (image_data) {
                data.image_data = image_data;
            }
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

        return {job_id: null, data: null};
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
                        return {job_id, data: null};
                    }
                    continue;
                }
                return {job_id, data: r.data};
            } catch (e) {
                console.log('failed to parse server response for solution', e);
                break;
            }
        }

        return {job_id, data: null};
    }
}
