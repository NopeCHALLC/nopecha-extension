import { Cache, deep_copy, Time  } from './utils.mjs'
import * as bapi from './api.js'

console.clear();

console.log('browser.runtime.id', bapi.browser.runtime.id, 'on', bapi.VERSION);

class Net {
    static async fetch({data: {url, options}}) {
        try {
            const res = await fetch(url, options);
            return await res.text();
        } catch(e) {
            console.error("failed to fetch", url, e)
            return null;
        }
    }
}


class Tab {
    static reloads = {};  // tab_id -> {delay, start, timer}

    static _reload({tab_id}) {
        return new Promise(resolve => bapi.browser.tabs.reload(tab_id, {bypassCache: true}, resolve));
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
        return new Promise(resolve => bapi.browser.tabs.remove(tab_id, resolve));
    }

    static async open({tab_id, data: {url}}) {
        bapi.browser.tabs.create({url});
    }

    static info({tab_id}) {
        return new Promise(resolve => {
            try {
                bapi.browser.tabs.get(tab_id, tab => resolve(tab));
            } catch (e) {
                console.log('error getting tab info', e);
                resolve(false);
            }
        });
    }
}


class Settings {
    static DEFAULT = {
        version: 3,

        key: '',

        hcaptcha_auto_solve: true,
        hcaptcha_solve_delay: 3000,
        hcaptcha_auto_open: true,

        recaptcha_auto_solve: true,
        recaptcha_solve_delay: 1000,
        recaptcha_auto_open: true,
        recaptcha_solve_method: 'image',

        ocr_auto_solve: true,
        ocr_image_selector: '',
        ocr_input_selector: '',

        debug: false,
    };
    static data = {};

    static _save() {
        return new Promise(resolve => bapi.browser.storage.sync.set({settings: Settings.data}, resolve));
    }

    static load() {
        return new Promise(resolve => {
            let storage = bapi.browser.storage;
            if(!storage){  // Browsers such as chromium
                resolve();
                return;
            }
            storage.sync.get(['settings'], async ({settings}) => {
                if (!settings) {
                    await Settings.reset();
                }
                else {
                    Settings.data = settings;
                    if (Settings.data.version !== Settings.DEFAULT.version) {
                        const key = Settings.data.key;
                        await Settings.reset();
                        Settings.data.key = key;
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
        const manifest = bapi.browser.runtime.getManifest();
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
        return new Promise(resolve => bapi.browser.scripting.executeScript(options, resolve));
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
    static STATUS_URL = `https://api.nopecha.com/status?v=${bapi.browser.runtime.getManifest().version}`;
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
        bapi.browser.action.setIcon({path});
        bapi.browser.action.setBadgeText({text});
        bapi.browser.action.setBadgeBackgroundColor({color});
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

    bapi.registerHlFilter();

    // await Server.check_status();
    // Server.run_status_check();

    // await Settings.reset();
    await Settings.load();
    // console.log('loaded settings', Settings.data);

    // async would not a problem because this is the only listener
    bapi.browser.runtime.onMessage.addListener((req, sender, send) => {
        // Chrome doesn't support async event listeners yet
        (async () => {
            const verbose = !['get_settings', 'set_settings', 'set_cache'].includes(req.method);

            if (verbose) {
                console.log('message', sender?.tab?.id, req);
            }

            try{
                let result = await FN[req.method]({tab_id: sender?.tab?.id, data: req.data});

                if (verbose){
                    console.log('result', result);
                }
                return result;
            } catch (e){
                console.error("Failed while executting ", req, "exception happened", e);
                throw e;
            }
        })().then(send).catch((s) => {console.error(s); send(s)});
        // Will respond using the send callback
        return true;
    });

})();
