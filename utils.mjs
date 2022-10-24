'use strict';


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
    static pad_left(s, char, n) {
        while (`${s}`.length < n) {
            s = `${char}${s}`;
        }
        return s;
    }

    static capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
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
