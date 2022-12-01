import {deep_copy, SettingsManager, Time} from './utils.mjs'
import * as bapi from './api.js'


console.clear();
console.log('browser.runtime.id', bapi.browser.runtime.id, 'on', bapi.VERSION);


class API {
    static endpoints = {};

    static register(obj, fname) {
        const endpoint = `${obj.name}.${fname}`;
        const fn = obj[fname];
        function wrapped() {
            return fn.apply(obj, [{tab_id: arguments[0].tab_id, frame_id: arguments[0].frame_id, ...arguments[0].data}]);
        }
        this.endpoints[endpoint] = wrapped;
    }
}


class Cache {
    // Runtime variables cache
    static cache = {};

    // Values, counts, and arrays
    static async set({tab_id, name, value, tab_specific}={tab_specific: false}) {
        if (tab_specific) {
            name = `${tab_id}_${name}`;
        }
        Cache.cache[name] = value;
        return Cache.cache[name];
    }

    // Values, counts, and arrays
    static async get({tab_id, name, tab_specific}={tab_specific: false}) {
        if (tab_specific) {
            name = `${tab_id}_${name}`;
        }
        return Cache.cache[name];
    }

    // Values, counts, and arrays
    static async remove({tab_id, name, tab_specific}={tab_specific: false}) {
        if (tab_specific) {
            name = `${tab_id}_${name}`;
        }
        const value = Cache.cache[name];
        delete Cache.cache[name];
        return value;
    }

    // Arrays
    static async append({tab_id, name, value, tab_specific}={tab_specific: false}) {
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
    static async empty({tab_id, name, tab_specific}={tab_specific: false}) {
        if (tab_specific) {
            name = `${tab_id}_${name}`;
        }
        const value = Cache.cache[name];
        Cache.cache[name] = [];
        return value;
    }

    // Counts
    static async inc({tab_id, name, tab_specific}={tab_specific: false}) {
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
    static async dec({tab_id, name, tab_specific}={tab_specific: false}) {
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
    static async zero({tab_id, name, tab_specific}={tab_specific: false}) {
        if (tab_specific) {
            name = `${tab_id}_${name}`;
        }
        Cache.cache[name] = 0;
        return Cache.cache[name];
    }

    static {
        API.register(this, 'set');
        API.register(this, 'get');
        API.register(this, 'remove');
        API.register(this, 'append');
        API.register(this, 'empty');
        API.register(this, 'inc');
        API.register(this, 'dec');
        API.register(this, 'zero');
    }
}


class Settings {
    static data = {};

    static _save() {
        console.log('Settings.save', Settings.data);
        return new Promise(resolve => {
            bapi.browser.storage.sync.set({settings: Settings.data}, resolve);
        });
    }

    // static load() {
    //     return new Promise(resolve => {
    //         const storage = bapi.browser.storage;
    //         if (!storage) {
    //             resolve();
    //             return;
    //         }
    //         storage.sync.get(['settings'], async ({settings}) => {
    //             if (!settings) {
    //                 await Settings.reset();
    //             }
    //             else {
    //                 Settings.data = settings;
    //                 if (Settings.data.version !== SettingsManager.DEFAULT.version) {
    //                     const key = Settings.data.key;
    //                     console.log('mismatched version', key);
    //                     await Settings.reset();
    //                     Settings.data.key = key;
    //                 }
    //             }
    //             resolve();
    //         });
    //     });
    // }

    static _get_settings() {
        return new Promise(resolve => {
            bapi.browser.storage.sync.get(['settings'], ({settings}) => {
                console.log('Settings._get_settings', settings);
                resolve(settings);
            });
        });
    }

    static async load() {
        for (let i = 0; i < 4; i++) {
            const settings = await Settings._get_settings();
            if (!settings) {
                // await Time.sleep(100);
                continue;
            }
            Settings.data = settings;
            if (Settings.data.version !== SettingsManager.DEFAULT.version) {
                const key = Settings.data.key;
                console.log('mismatched version', key);
                await Settings.reset();
                Settings.data.key = key;
            }
            return;
        }
        console.log('settings load retry exceeded');
        await Settings.reset();
    }

    static async get() {
        return Settings.data;
    }

    static async set({id, value}) {
        Settings.data[id] = value;
        await Settings._save();
    }

    static async update({settings}) {
        for (const [k, v] of Object.entries(settings)) {
            Settings.data[k] = v;
        }
        await Settings._save();
    }

    static async replace({settings}) {
        Settings.data = settings;
        await Settings._save();
    }

    static async reset() {
        Settings.data = deep_copy(SettingsManager.DEFAULT);

        // // Set key from manifest
        // const manifest = bapi.browser.runtime.getManifest();
        // if (manifest.nopecha_key) {
        //     Settings.data.key = manifest.nopecha_key;
        // }

        await Settings._save();
    }

    static {
        API.register(this, 'get');
        API.register(this, 'set');
        API.register(this, 'update');
        API.register(this, 'replace');
        API.register(this, 'reset');
    }
}


class Net {
    static async fetch({url, options}={options: {}}) {
        try {
            const res = await fetch(url, options);
            return await res.text();
        } catch (e) {
            console.error("failed to fetch", url, e)
            return null;
        }
    }

    static {
        API.register(this, 'fetch');
    }
}


class Tab {
    static reloads = {};  // tab_id -> {delay, start, timer}

    static _reload({tab_id}) {
        return new Promise(resolve => bapi.browser.tabs.reload(tab_id, {bypassCache: true}, resolve));
    }

    static async reload({tab_id, delay, overwrite}={delay: 0, overwrite: true}) {
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

    static open({url}={url: null}) {
        return new Promise(resolve => bapi.browser.tabs.create({url}, resolve));
    }

    static navigate({tab_id, url}) {
        return new Promise(resolve => bapi.browser.tabs.update(tab_id, {url}, resolve));
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
        // `tab` will either be a `tabs.Tab` instance or `undefined`
        return new Promise(async resolve => {
            if (bapi.VERSION === 'firefox') {
                // MV2
                bapi.browser.tabs.query({active: true, lastFocusedWindow: true}, ([tab]) => {
                    if (bapi.browser.runtime.lastError) {
                        console.error(bapi.browser.runtime.lastError);
                    }
                    resolve(tab);
                });
            }
            else {
                // MV3
                const [tab] = await bapi.browser.tabs.query({active: true, lastFocusedWindow: true});
                return resolve(tab);
            }
        });
    }

    static {
        API.register(this, 'reload');
        API.register(this, 'close');
        API.register(this, 'open');
        API.register(this, 'navigate');
        API.register(this, 'info');
        API.register(this, 'active');
    }
}


class Inject {
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

    static async func({tab_id, func, args}={args: []}) {
        const options = {
            target: {tabId: tab_id, allFrames: true},
            world: 'MAIN',
            injectImmediately: true,
            func: func,
            args: args,
        };
        // return new Promise(resolve => bapi.browser.scripting.executeScript(options, resolve));
        return await Inject._inject(options);
    }

    static async files({tab_id, frame_id, files}) {
        const options = {
            target: {tabId: tab_id, frameIds: [frame_id]},
            world: 'MAIN',
            injectImmediately: true,
            files: files,
        };
        if (bapi.VERSION === 'firefox') {
            delete options.world;
        }
        return await Inject._inject(options);
    }

    static {
        API.register(this, 'func');
        API.register(this, 'files');
    }
}


class Recaptcha {
    static async reset({tab_id}) {
        await Inject.func({tab_id, data: {func: () => {try {window.grecaptcha?.reset();} catch {}}, args: []}});
        return true;
    }

    static {
        API.register(this, 'reset');
    }
}


class Server {
    static ENDPOINT = `https://api.nopecha.com/status?v=${bapi.browser.runtime.getManifest().version}`;
    static is_fetching_plan = false;

    static async get_plan({key}) {
        if (Server.is_fetching_plan) {
            return false;
        }
        Server.is_fetching_plan = true;
        let plan = {
            plan: 'Unknown',
            credit: 0,
        };
        try {
            if (key === 'undefined') {
                key = '';
            }
            const r = await fetch(`${Server.ENDPOINT}&key=${key}`);
            plan = JSON.parse(await r.text());
        } catch {}
        Server.is_fetching_plan = false;
        return plan;
    }

    static {
        API.register(this, 'get_plan');
    }
}


class Image {
    static encode({url}) {
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

    static {
        API.register(this, 'encode');
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

    static {
        API.register(this, 'send');
    }
}


class Icon {
    static set({status}) {
        return new Promise(resolve => {
            const ba = bapi.VERSION === 'firefox' ? bapi.browser.browserAction : bapi.browser.action;
            if (status === 'on') {
                ba.setIcon({
                    path: {
                        '16': '/icon/16.png',
                        '32': '/icon/32.png',
                        '48': '/icon/48.png',
                        '128': '/icon/128.png',
                    },
                }, resolve);
            }
            else if (status === 'off') {
                ba.setIcon({
                    path: {
                        '16': '/icon/16g.png',
                        '32': '/icon/32g.png',
                        '48': '/icon/48g.png',
                        '128': '/icon/128g.png',
                    },
                }, resolve);
            }
            else {
                console.error('unknown icon mode', status);
                resolve(false);
            }
        });
    }

    static set_badge_text({tab_id, data}) {
        return new Promise(resolve => {
            const options = {text: data};
            if (tab_id) {
                options.tabId = tab_id;
            }
            bapi.browser.action.setBadgeText(options, resolve);
        });
    }

    static set_badge_color({tab_id, data}) {
        return new Promise(resolve => {
            const options = {color: data};
            if (tab_id) {
                options.tabId = tab_id;
            }
            bapi.browser.action.setBadgeBackgroundColor(options, resolve);
        });
    }

    static async set_badge({tab_id, data: {global, text, color}}) {
        if (!tab_id && !global) {
            const tab = await Tab.active();
            tab_id = tab.id;
        }

        if (global) {
            tab_id = null;
        }

        const proms = [Icon.set_badge_text({tab_id, data: text})];
        if (color) {
            proms.push(Icon.set_badge_color({tab_id, data: color}));
        }
        return await Promise.all(proms);
    }

    static {
        API.register(this, 'set');
    }
}


class Browser {
    static async version() {
        return bapi.VERSION;
    }

    static async log() {
        console.warn('Browser.log', ...arguments);
    }

    static {
        API.register(this, 'version');
        API.register(this, 'log');
    }
}


class ContextMenu {
    static listen() {
        function on_context_menu(info, tab) {
            if (info.menuItemId === 'nopecha_disable_host') {
                const url = info.pageUrl;
                if (!url) {
                    return;
                }
                const hostname = url.replace(/^(.*:)\/\/([A-Za-z0-9\-\.]+)(:[0-9]+)?(.*)$/, '$2');
                let hosts = new Set();
                for (const e of Settings.data.disabled_hosts) {
                    hosts.add(e.trim());
                }
                hosts.add(hostname);
                hosts = [...hosts];
                Settings.set({id: 'disabled_hosts', value: hosts});
            }
        };
        bapi.browser.contextMenus.onClicked.addListener(on_context_menu);
    }

    static create() {
        bapi.browser.contextMenus.create({'title': 'Disable NopeCHA on this site', 'id': 'nopecha_disable_host'});
        // bapi.browser.contextMenus.create({'title': 'NopeCHA: CAPTCHA Solver', 'id': 'parent'});
        // bapi.browser.contextMenus.create({'title': 'Disable NopeCHA on this site', 'parentId': 'parent', 'id': 'child0'});
        // bapi.browser.contextMenus.create({'title': 'Select Text CAPTCHA Image Element', 'parentId': 'parent', 'id': 'child1'});
        // bapi.browser.contextMenus.create({'title': 'Select Text CAPTCHA Input Element', 'parentId': 'parent', 'id': 'child2'});
    }

    static {
        bapi.browser.runtime.onInstalled.addListener(ContextMenu.create);
        ContextMenu.listen();
    }
}


(async () => {
    // bapi.reconnect_scripts();

    bapi.register_language();

    await Settings.load();

    await Icon.set({status: Settings.data.enabled ? 'on' : 'off'});

    bapi.browser.runtime.onMessage.addListener((req, sender, send) => {
        const method = req[0];
        let data = null;
        if (req.length > 1) {
            if (req.length === 2) {
                data = req[1];
            }
            else {
                data = req.slice(1);
            }
        }
        const tab_id = (data && 'tab_id' in data) ? data.tab_id : sender?.tab?.id;
        const frame_id = sender?.frameId;
        // console.log('method', method, data);

        try {
            API.endpoints[method]({tab_id, frame_id, data})
                .then(r => {
                    const verbose = !['Browser.log', 'Settings.get', 'Settings.set', 'Cache.get', 'Cache.set', 'Tab.info'].includes(method);

                    if (verbose){
                        console.log(method, r);
                    }

                    try {
                        send(r);
                    } catch (e) {
                        console.error('error in send\n', method, '\n', data, e);
                    }

                })
                .catch(e => {
                    console.error('error in api method\n', method, '\n', data, e);
                });
        } catch (e) {
            console.error('error in api call\n', method, '\n', data, e);
        }

        return true;
    });

})();
