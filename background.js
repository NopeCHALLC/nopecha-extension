import {Cache, deep_copy, Time} from './utils.mjs'
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

    static active() {
        // TODO: Implement MV2
        // https://developer.chrome.com/docs/extensions/reference/tabs/#get-the-current-tab

        // `tab` will either be a `tabs.Tab` instance or `undefined`
        return new Promise(async resolve => {
            // MV3
            const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
            return resolve(tab);

            // MV2
            // chrome.tabs.query({active: true, lastFocusedWindow: true}, ([tab]) => {
            //     if (chrome.runtime.lastError) {
            //         console.error(chrome.runtime.lastError);
            //     }
            //     resolve(tab);
            // });
        });
    }
}


class Settings {
    static DEFAULT = {
        version: 5,

        active_tab: '#hcaptcha_tab',

        key: '',

        hcaptcha_auto_solve: true,
        hcaptcha_solve_delay: 3000,
        hcaptcha_auto_open: true,

        recaptcha_auto_solve: true,
        recaptcha_solve_delay: 1000,
        recaptcha_auto_open: true,
        recaptcha_solve_method: 'image',

        funcaptcha_auto_solve: true,
        funcaptcha_solve_delay: 1000,
        funcaptcha_auto_open: true,

        ocr_auto_solve: false,
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
            if (!storage) {  // Browsers such as chromium
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
                // Temporary fix
                if (Settings.data.key?.startsWith('MIIBI')) {
                    Settings.data.key = '';
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

        // Set key from manifest
        const manifest = bapi.browser.runtime.getManifest();
        if (manifest.nopecha_key) {
            Settings.data.key = manifest.nopecha_key;
        }

        await Settings._save();
    }
}


class Injector {
    static async _inject(options) {
        // Inject into active tab if target tabId is undefined
        if (!options.target.tabId) {
            const tab = await Tab.active();
            options.target.tabId = tab.id;
        }

        // Convert callback to promise
        console.log('inject', options);
        const prom = new Promise(resolve => bapi.browser.scripting.executeScript(options, resolve));
        return await prom;
    }

    static async inject_func({tab_id, data: {func, args}}) {
        const options = {
            target: {tabId: tab_id, allFrames: true},
            world: 'MAIN',
            injectImmediately: true,
            func: func,
            args: args,
        };
        // return new Promise(resolve => bapi.browser.scripting.executeScript(options, resolve));
        return await Injector._inject(options);
    }

    static async inject_files({tab_id, data: {files}}) {
        const options = {
            target: {tabId: tab_id, allFrames: true},
            world: 'MAIN',
            injectImmediately: true,
            files: files,
        };
        return await Injector._inject(options);
    }
}
// Injector.inject_files({tab_id: null, data: {files: ['autodetect.js']}});


class Recaptcha {
    static async reset({tab_id}) {
        await Injector.inject_func({tab_id, data: {func: () => {try {window.grecaptcha?.reset();} catch {}}, args: []}});
        return true;
    }
}


class Server {
    static ENDPOINT = `https://api.nopecha.com/status?v=${bapi.browser.runtime.getManifest().version}`;
    static in_progress = false;

    static async get_plan({data: {key}}) {
        if (Server.in_progress) {
            return false;
        }
        Server.in_progress = true;
        let plan = {
            plan: 'Unknown',
            credit: 0,
        };
        try {
            if (key === 'undefined') {
                key = '';
            }
            const r = await fetch(`${Server.ENDPOINT}&k=${key}`);
            plan = JSON.parse(await r.text());
        } catch {}
        Server.in_progress = false;
        return plan;
    }
}


class Image {
    static b64({data: {url}}) {
        return new Promise(resolve => {
            fetch(url)
                .then(response => response.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
        });
    }
}


class Relay {
    static async send({tab_id, data}) {
        // Send to active tab if tab_id is undefined
        if (!tab_id) {
            const tab = await Tab.active();
            tab_id = tab.id;
        }
        bapi.browser.tabs.sendMessage(tab_id, data);
    }
}
// setInterval(() => {
//     Relay.send({tab_id: undefined, data: {testing: 'hello world!'}});
// }, 1000);


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
    active_tab: Tab.active,

    get_settings: Settings.get,
    set_settings: Settings.set,
    reset_settings: Settings.reset,

    inject_files: Injector.inject_files,

    reset_recaptcha: Recaptcha.reset,

    get_server_plan: Server.get_plan,

    b64_image: Image.b64,

    relay: Relay.send,
};


(async () => {
    // Force language for reCAPTCHA and FunCAPTCHA
    bapi.register_language();

    // await Settings.reset();
    await Settings.load();
    // console.log('Settings.data', Settings.data);

    bapi.browser.runtime.onMessage.addListener((req, sender, send) => {
        // Chrome doesn't support async event listeners yet
        (async () => {
            const verbose = !['get_settings', 'set_settings', 'set_cache'].includes(req.method);

            if (verbose) {
                console.log('message', sender?.tab?.id, req);
            }

            try{
                const result = await FN[req.method]({tab_id: sender?.tab?.id, data: req.data});
                if (verbose){
                    console.log('result', result);
                }
                return result;
            } catch (e){
                console.error('Failed while executting ', req, 'exception happened', e);
                throw e;
            }
        })().then(send).catch((s) => {console.error(s); send(s)});

        // Will respond using the send callback
        return true;
    });
})();
