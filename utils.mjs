'use strict';


/**
 * Set to true for the following behavior:
 * - Request server to recognize using bleeding-edge models
 * - Reload FunCAPTCHA on verification
 */
export const IS_DEVELOPMENT = false;


/**
 * Trying to be an Enum but javascript doesn't have enums
 */
export class RunningAs {
    // Background script running on-demand
    static BACKGROUND = 'BACKGROUND';
    // Popup specified in manifest as "action"
    static POPUP = 'POPUP';
    // Content script running in page
    static CONTENT = 'CONTENT';
    // (somehow) Standalone run of script running in webpage
    static WEB = 'WEB';
}
Object.freeze(RunningAs);


export const runningAt = (() => {
    let getBackgroundPage = globalThis?.chrome?.extension?.getBackgroundPage;
    if (getBackgroundPage){
        return getBackgroundPage() === window ? RunningAs.BACKGROUND : RunningAs.POPUP;
    }
    return globalThis?.chrome?.runtime?.onMessage ? RunningAs.CONTENT : RunningAs.WEB;
})();


export function deep_copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}


export class Util {
    static CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    static pad_left(s, char, n) {
        while (`${s}`.length < n) {
            s = `${char}${s}`;
        }
        return s;
    }

    static capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    static parse_int(s, fallback) {
        if (!s) {
            s = fallback;
        }
        return parseInt(s);
    }

    static parse_bool(s, fallback) {
        if (s === 'true') {
            s = true;
        }
        else if (s === 'false') {
            s = false;
        }
        else {
            s = fallback;
        }
        return s;
    }

    static parse_string(s, fallback) {
        if (!s) {
            s = fallback;
        }
        return s;
    }

    static generate_id(n) {
        let result = '';
        for (let i = 0; i < n; i++) {
            result += Util.CHARS.charAt(Math.floor(Math.random() * Util.CHARS.length));
        }
        return result;
    }
}


export class Time {
    static time() {
        if (!Date.now) {
            Date.now = () => new Date().getTime();
        }
        return Date.now();
    }

    static date() {
        return new Date();
    }

    static sleep(i=1000) {
        return new Promise(resolve => setTimeout(resolve, i));
    }

    static async random_sleep(min, max) {
        const duration = Math.floor(Math.random() * (max - min) + min);
        return await Time.sleep(duration);
    }

    static seconds_as_hms(t) {
        t = Math.max(0, t);
        const hours = Util.pad_left(Math.floor(t / 3600), '0', 2);
        t %= 3600;
        const minutes = Util.pad_left(Math.floor(t / 60), '0', 2);
        const seconds = Util.pad_left(Math.floor(t % 60), '0', 2);
        return `${hours}:${minutes}:${seconds}`;
    }

    static string(d=null) {
        if (!d) {
            d = Time.date();
        }
        const month = Util.pad_left(d.getMonth() + 1, '0', 2);
        const date = Util.pad_left(d.getDate(), '0', 2);
        const year = d.getFullYear();
        const hours = Util.pad_left(d.getHours() % 12, '0', 2);
        const minutes = Util.pad_left(d.getMinutes(), '0', 2);
        const seconds = Util.pad_left(d.getSeconds(), '0', 2);
        const period = d.getHours() >= 12 ? 'PM' : 'AM';
        return `${month}/${date}/${year} ${hours}:${minutes}:${seconds} ${period}`;
    }
}


export class Cache {
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


export class SettingsManager {
    static DEFAULT = {
        version: 9,

        key: '',

        enabled: true,

        hcaptcha_auto_open: true,
        hcaptcha_auto_solve: true,
        hcaptcha_solve_delay: true,

        recaptcha_auto_open: true,
        recaptcha_auto_solve: true,
        recaptcha_solve_delay: true,
        recaptcha_solve_method: 'Image',

        funcaptcha_auto_open: true,
        funcaptcha_auto_solve: true,
        funcaptcha_solve_delay: true,

        awscaptcha_auto_open: true,
        awscaptcha_auto_solve: true,
        awscaptcha_solve_delay: true,

        textcaptcha_auto_solve: true,
        textcaptcha_image_selector: '',
        textcaptcha_input_selector: '',

        turnstile_auto_solve: true,
    };

    static ENCODE_FIELDS = {
        enabled: {parse: Util.parse_bool},

        hcaptcha_auto_open: {parse: Util.parse_bool},
        hcaptcha_auto_solve: {parse: Util.parse_bool},
        hcaptcha_solve_delay: {parse: Util.parse_bool},

        recaptcha_auto_open: {parse: Util.parse_bool},
        recaptcha_auto_solve: {parse: Util.parse_bool},
        recaptcha_solve_delay: {parse: Util.parse_bool},
        recaptcha_solve_method: {parse: Util.parse_string},

        funcaptcha_auto_open: {parse: Util.parse_bool},
        funcaptcha_auto_solve: {parse: Util.parse_bool},
        funcaptcha_solve_delay: {parse: Util.parse_bool},

        awscaptcha_auto_open: {parse: Util.parse_bool},
        awscaptcha_auto_solve: {parse: Util.parse_bool},
        awscaptcha_solve_delay: {parse: Util.parse_bool},

        textcaptcha_auto_solve: {parse: Util.parse_bool},
        textcaptcha_image_selector: {parse: Util.parse_string},
        textcaptcha_input_selector: {parse: Util.parse_string},

        turnstile_auto_solve: {parse: Util.parse_bool},
    };

    static IMPORT_URL = 'https://nopecha.com/setup';
    static DELIMITER = '|';

    static export(settings) {
        if (!settings.key) {
            return false;
        }

        const fields = [settings.key];
        for (const k in SettingsManager.ENCODE_FIELDS) {
            fields.push(`${k}=${encodeURIComponent(settings[k])}`);
        }

        const encoded_hash = `#${fields.join(SettingsManager.DELIMITER)}`;

        return `${SettingsManager.IMPORT_URL}${encoded_hash}`;
    }

    static import(encoded_hash) {
        const settings = {};

        // Split by delimiter
        const fields = encoded_hash.split(SettingsManager.DELIMITER);
        if (fields.length === 0) {
            return settings;
        }

        // Parse key
        const key = fields.shift();
        if (key.length <= 1) {
            console.error('invalid key for settings', key);
            return settings;
        }
        settings.key = key.substring(1);

        // Parse additional fields
        for (const field of fields) {
            const kv = field.split('=');
            const k = kv.shift();
            const v_raw = kv.join('=');

            if (!(k in SettingsManager.ENCODE_FIELDS)) {
                console.error('invalid field for settings', field);
                continue;
            }

            const v = decodeURIComponent(v_raw);
            settings[k] = SettingsManager.ENCODE_FIELDS[k].parse(v, SettingsManager.DEFAULT[k]);
        }

        return settings;
    }

    // static update(base_settings, new_settings) {
    //     // In-place mutation of base_settings
    //     for (const k in new_settings) {
    //         base_settings[k] = new_settings[k];
    //     }
    //     return base_settings;
    // }
}
