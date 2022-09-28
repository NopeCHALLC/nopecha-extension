'use strict';


class Type {
    static _string_constructor = 'string'.constructor;
    static _array_constructor = [].constructor;
    static _object_constructor = ({}).constructor;

    static of(e) {
        if (e === null) {
            return 'null';
        }
        if (e === undefined) {
            return 'undefined';
        }
        if (e.constructor === Type._string_constructor) {
            return 'string';
        }
        if (e.constructor === Type._array_constructor) {
            return 'array';
        }
        if (e.constructor === Type._object_constructor) {
            return 'object';
        }
        return '';
    }
}


class Logger {
    static debug = true;

    static log(print_console=true) {
        const args = (new Array(...arguments)).map(e => ['array', 'object'].includes(Type.of(e)) ? JSON.stringify(e, null, 4) : `${e}`);
        const s = args.join(' ');

        // if (Logger.debug) {
        //     if (print_console) {
        //         console.log(...arguments);
        //         // console.log(`%c${Time.string()}:`, 'color: yellow;', s);
        //     }
        // }

        console.log(...arguments);
    }
}


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
                    if (res.startsWith('data:text/html;base64,'))
                        return resolve(null);
                    res = res.replace('data:image/jpeg;base64,', '');
                    resolve(res);
                };
                reader.readAsDataURL(xhr.response);
            };
            xhr.onerror = () => {
                resolve(null);
            };
            xhr.onreadystatechange = () => {
                // console.log(this.readyState, this.status);
                if (this.readyState == 4 && this.status != 200)
                    resolve(null);
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

    static async post({captcha_type, task, task_image, images, grid, key}) {
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
            if (task_image) {
                data.task_image = task_image;
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

                // await Time.sleep(500);
                return await NopeCHA.get({job_id: r.data, key});
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


function oep(selector, n_match=1, i=100) {
    return new Promise(resolve => {
        const check = setInterval(() => {
            const $e = document.querySelectorAll(selector);
            if ($e.length === n_match) {
                clearInterval(check);
                if (n_match === 1)
                    return resolve($e[0]);
                return resolve($e);
            }
        }, i);
    });
}


export {Type, Logger, Time, BG, Net, Image, NopeCHA, oep};
