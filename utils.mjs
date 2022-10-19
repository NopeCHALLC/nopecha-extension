'use strict';

export function deep_copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export class Type {
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


export class Logger {
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


export class Time {
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

    static seconds_as_hms(t) {
        t = Math.max(0, t);
        const hours = Math.floor(t / 3600);
        t %= 3600;
        const minutes = Math.floor(t / 60);
        const seconds = Math.floor(t % 60);
        const hms = `${Util.pad_left(hours, '0', 2)}:${Util.pad_left(minutes, '0', 2)}:${Util.pad_left(seconds, '0', 2)}`;
        return hms;
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


export function oep(selector, n_match=1, i=100) {
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
