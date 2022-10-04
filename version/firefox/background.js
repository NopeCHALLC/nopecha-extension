(() => {
    console.clear();
    console.log('browser.runtime.id', browser.runtime.id);


    function deep_copy(obj) {
        return JSON.parse(JSON.stringify(obj));
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


    class Cache {
        // Runtime variables cache
        static cache = {};

        // Values, counts, and arrays
        static async set({tab_id, data: {name, value, tab_specific}}) {
            if (tab_specific) {
                name = `${tab_id}_${name}`;
            }
            Cache.cache[name] = value;
            return Cache.cache[name];
        }

        // Values, counts, and arrays
        static async get({tab_id, data: {name, tab_specific}}) {
            console.log('Cache.get', tab_id, Cache.cache);
            if (tab_specific) {
                name = `${tab_id}_${name}`;
            }
            return Cache.cache[name];
        }

        // Values, counts, and arrays
        static async remove({tab_id, data: {name, tab_specific}}) {
            if (tab_specific) {
                name = `${tab_id}_${name}`;
            }
            const value = Cache.cache[name];
            delete Cache.cache[name];
            return value;
        }

        // Arrays
        static async append({tab_id, data: {name, value, tab_specific}}) {
            if (tab_specific) {
                name = `${tab_id}_${name}`;
            }
            if (!(name in Cache.cache)) {
                Cache.cache[name] = [];
            }
            Cache.cache[name].push(value);
            return Cache.cache[name];
        }

        // Arrays
        static async empty({tab_id, data: {name, tab_specific}}) {
            if (tab_specific) {
                name = `${tab_id}_${name}`;
            }
            const value = Cache.cache[name];
            Cache.cache[name] = [];
            return value;
        }

        // Counts
        static async inc({tab_id, data: {name, tab_specific}}) {
            if (tab_specific) {
                name = `${tab_id}_${name}`;
            }
            if (!(name in Cache.cache)) {
                Cache.cache[name] = 0;
            }
            Cache.cache[name]++;
            return Cache.cache[name];
        }

        // Counts
        static async dec({tab_id, data: {name, tab_specific}}) {
            if (tab_specific) {
                name = `${tab_id}_${name}`;
            }
            if (!(name in Cache.cache)) {
                Cache.cache[name] = 0;
            }
            Cache.cache[name]--;
            return Cache.cache[name];
        }

        // Counts
        static async zero({tab_id, data: {name, tab_specific}}) {
            if (tab_specific) {
                name = `${tab_id}_${name}`;
            }
            Cache.cache[name] = 0;
            return Cache.cache[name];
        }
    }


    class Net {
        static async fetch({data: {url, options}}) {
            try {
                const res = await fetch(url, options);
                return await res.text();
            } catch {
                return null;
            }
        }
    }


    class Tab {
        static reloads = {};  // tab_id -> {delay, start, timer}

        static _reload({tab_id}) {
            return new Promise(resolve => browser.tabs.reload(tab_id, {bypassCache: true}, resolve));
        }

        static async reload({tab_id, data: {delay, overwrite}={delay: 0, overwrite: true}}) {
            // Clear and start timer if overwrite is true or if delay <= remaining time of active timer
            delay = parseInt(delay);
            let remaining = Tab.reloads[tab_id]?.delay - (Date.now() - Tab.reloads[tab_id]?.start);
            remaining = (isNaN(remaining) || remaining < 0) ? 0 : remaining;
            // console.log('reload_after', tab_id, 'delay', delay, 'overwrite', overwrite, 'remaining', remaining);

            if (overwrite || remaining == 0 || delay <= remaining) {
                // console.log(`set reload timer tab=${tab_id} after=${delay/1000}s`);
                clearTimeout(Tab.reloads[tab_id]?.timer);
                Tab.reloads[tab_id] = {
                    delay: delay,
                    start: Date.now(),
                    timer: setTimeout(() => Tab._reload({tab_id}), delay),
                };
                return true;
            }
            return false;
        }

        static close({tab_id}) {
            return new Promise(resolve => browser.tabs.remove(tab_id, resolve));
        }

        static async open({tab_id, data: {url}}) {
            browser.tabs.create({url});
        }

        static info({tab_id}) {
            return new Promise(resolve => {
                try {
                    browser.tabs.get(tab_id, tab => resolve(tab));
                } catch (e) {
                    console.log('error getting tab info', e);
                    resolve(false);
                }
            });
        }
    }


    class Settings {
        static DEFAULT = {
            version: 2,

            hcaptcha_auto_solve: true,
            hcaptcha_solve_delay: 3000,
            hcaptcha_auto_open: true,
            hcaptcha_open_delay: 1000,

            recaptcha_auto_solve: true,
            recaptcha_solve_delay: 1000,
            recaptcha_auto_open: true,
            recaptcha_open_delay: 1000,
            recaptcha_solve_method: 'image',

            debug: false,
        };
        static data = {};

        static _save() {
            return new Promise(resolve => browser.storage.local.set({settings: Settings.data}, resolve));
        }

        static load() {
            return new Promise(resolve => {
                browser.storage.local.get(['settings'], async ({settings}) => {
                    if (!settings) {
                        await Settings.reset();
                    }
                    else {
                        Settings.data = settings;
                        if (Settings.data.version !== Settings.DEFAULT.version) {
                            await Settings.reset();
                        }
                    }
                    resolve();
                });
            });
        }

        static async get() {
            return Settings.data;
        }

        static async set({data: {id, value}}) {
            Settings.data[id] = value;
            await Settings._save();
        }

        static async reset() {
            Settings.data = deep_copy(Settings.DEFAULT);
            const manifest = browser.runtime.getManifest();
            if(manifest.key) Settings.data.key = manifest.key;
            await Settings._save();
        }
    }


    class Injector {
        static inject({tab_id, data: {func, args}}) {
            // console.log('injecting', tab_id, func);
            const options = {
                target: {tabId: tab_id, allFrames: true},
                world: 'MAIN',
                injectImmediately: true,
                func: func,
                args: args,
            };
            return new Promise(resolve => browser.scripting.executeScript(options, resolve));
        }
    }


    class Recaptcha {
        static async reset({tab_id}) {
            function func() {
                try {window.grecaptcha?.reset();} catch {}
                // try {window.RefreshCaptcha();} catch {}
            }
            await Injector.inject({tab_id, data: {func, args: []}});
            return true;
        }

        static fetch({tab_id}) {
            return new Promise(async resolve => {
                function func(name) {
                    if (window.grecaptcha) {
                        window.postMessage({method: 'set_cache', data: {name: name, value: window.grecaptcha.getResponse()}});
                    }
                }

                const name = 'recaptcha_response';
                await Injector.inject({tab_id, data: {func, args: [name]}});

                const interval = setInterval(async () => {
                    const value = await Cache.get({data: {name}});
                    console.log('fetched value', name, value);
                    if (value) {
                        clearInterval(interval);
                        await Cache.remove({data: {name}});
                        return resolve(value);
                    }
                }, 1000);
            });
        }
    }


    class Translator {
        static base_url = 'https://translate.googleapis.com/translate_a/single';

        static async translate({tab_id, data: {from, to, text}}) {
            let body = await fetch(`${Translator.base_url}?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURI(text)}`).then(r => r.json());
            body = body && body[0] && body[0][0] && body[0].map(s => s[0]).join('');
            return body;
        }
    }


    class Server {
        static STATUS_URL = `https://api.nopecha.com/status?v=${chrome.runtime.getManifest().version}`;
        static STATUS_CHECK_INTERVAL = 10000;
        static status = 'Online';
        static checking_status = false;

        static async run_status_check() {
            setInterval(() => {
                Server.check_status();
            }, Server.STATUS_CHECK_INTERVAL);
            return true;
        }

        static async check_status() {
            if (Server.checking_status) {
                return false;
            }
            Server.checking_status = true;
            let status = 'Offline';
            try {
                const r = await fetch(Server.STATUS_URL);
                status = await r.text();
            } catch {}
            await Server.set_status({data: {status}});
            Server.checking_status = false;
            return status;
        }

        static async set_status({data: {status}}) {
            if (Server.status === status) {
                return;
            }

            Server.status = status;
            let path;
            let color = [0, 0, 0, 0];
            let text = '';
            if (status === 'Online') {
                path = {
                    '16': 'icon/16.png',
                    '32': 'icon/32.png',
                    '48': 'icon/48.png',
                    '128': 'icon/128.png',
                };
            }
            else if (status === 'Offline') {
                path = {
                    '16': 'icon/16.png',
                    '32': 'icon/32.png',
                    '48': 'icon/48.png',
                    '128': 'icon/128.png',
                };
                text = 'Off';
                color = '#a44';
            }
            else if (status === 'Slow') {
                path = {
                    '16': 'icon/16.png',
                    '32': 'icon/32.png',
                    '48': 'icon/48.png',
                    '128': 'icon/128.png',
                };
                text = 'Slow';
                color = '#f8d66d';
            }
            else if (status === 'Update Required') {
                path = {
                    '16': 'icon/16.png',
                    '32': 'icon/32.png',
                    '48': 'icon/48.png',
                    '128': 'icon/128.png',
                };
                text = 'Update';
                color = '#f8d66d';
            }
            else {
                console.log('invalid status', status);
                return false;
            }
            chrome.action.setIcon({path});
            chrome.action.setBadgeText({text});
            chrome.action.setBadgeBackgroundColor({color});
            return true;
        }

        static async get_status() {
            await Server.check_status();
            return Server.status;
        }

        static async check_plan({data: {key}}) {
            if (Server.checking_plan) {
                return false;
            }
            Server.checking_plan = true;
            let plan = {
                plan: 'free',
                credit: 0,
            };
            try {
                if (key === 'undefined') {
                    key = '';
                }
                const r = await fetch(`${Server.STATUS_URL}&k=${key}`);
                plan = JSON.parse(await r.text());
            } catch {}
            Server.checking_plan = false;
            return plan;
        }

        static async get_plan({data: {key}}) {
            const plan = await Server.check_plan({data: {key}});
            return plan;
        }
    }


    const FN = {
        set_cache: Cache.set,
        get_cache: Cache.get,
        remove_cache: Cache.remove,
        append_cache: Cache.append,
        empty_cache: Cache.empty,
        inc_cache: Cache.inc,
        dec_cache: Cache.dec,
        zero_cache: Cache.zero,

        fetch: Net.fetch,

        reload_tab: Tab.reload,
        close_tab: Tab.close,
        open_tab: Tab.open,
        info_tab: Tab.info,

        get_settings: Settings.get,
        set_settings: Settings.set,
        reset_settings: Settings.reset,

        reset_recaptcha: Recaptcha.reset,
        fetch_recaptcha: Recaptcha.fetch,

        translate: Translator.translate,

        // set_server_status: Server.set_status,
        // get_server_status: Server.get_status,
        get_server_plan: Server.get_plan,
    };


    (async () => {
        const lang = 'en-US';
        browser.webRequest.onBeforeSendHeaders.addListener(e => {
            const url = new URL(e.url);
            if (url.searchParams.get('hl') !== lang) {
                url.searchParams.set('hl', lang);
                return {redirectUrl: url.toString()};
            }
        }, {urls: [
            '*://*.google.com/recaptcha/*',
            '*://*.recaptcha.net/recaptcha/*',
        ], types: ['sub_frame']}, ['blocking']);

        // await Server.check_status();
        // Server.run_status_check();

        // await Settings.reset();
        await Settings.load();
        // console.log('loaded settings', Settings.data);

        browser.runtime.onMessage.addListener((req, sender, send) => {
            const verbose = !['get_settings', 'set_settings', 'set_cache'].includes(req.method);

            if (verbose) {
                console.log('message', sender?.tab?.id, req);
            }

            FN[req.method]({tab_id: sender?.tab?.id, data: req.data}).then(r => {
                if (verbose)
                    console.log('result', r);
                try {
                    send(r);
                } catch (e) {
                    console.log('error sending result for method', req.method, e);
                }
            });

            return true;
        });
    })();
})();
