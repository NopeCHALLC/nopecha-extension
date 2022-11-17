/**
 *
 */

(() => {
    const xh = function(){"use strict";Array.prototype.indexOf||(Array.prototype.indexOf=function(e){for(let t=0;t<this.length;t++){if(this[t]===e)return t}return-1});const e=(e,t)=>Array.prototype.slice.call(e,t);let t=null;"undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope?t=self:"undefined"!=typeof global?t=global:window&&(t=window);const n="undefined"!=typeof navigator&&navigator.useragent?navigator.userAgent:"";let o=null;(/msie (\d+)/.test(n.toLowerCase())||/trident\/.*; rv:(\d+)/.test(n.toLowerCase()))&&(o=parseInt(RegExp.$1,10));const r=t,s=t.document,a=["load","loadend","loadstart"],i=["progress","abort","error","timeout"],c=e=>["returnValue","totalSize","position"].includes(e),u=function(e,t){for(let n in e){if(c(n))continue;const o=e[n];try{t[n]=o}catch(e){}}return t},l=function(e,t,n){const o=e=>function(o){const r={};for(let e in o){if(c(e))continue;const s=o[e];r[e]=s===t?n:s}return n.dispatchEvent(e,r)};for(let r of Array.from(e))n._has(r)&&(t[`on${r}`]=o(r))},d=function(e){if(s&&null!=s.createEventObject){const t=s.createEventObject();return t.type=e,t}try{return new Event(e)}catch(t){return{type:e}}},f=function(t){let n={};const o=e=>n[e]||[],r={addEventListener:function(e,t,r){n[e]=o(e),n[e].indexOf(t)>=0||(r=void 0===r?n[e].length:r,n[e].splice(r,0,t))},removeEventListener:function(e,t){if(void 0===e)return void(n={});void 0===t&&(n[e]=[]);const r=o(e).indexOf(t);-1!==r&&o(e).splice(r,1)},dispatchEvent:function(){const n=e(arguments),s=n.shift();t||(n[0]=u(n[0],d(s)));const a=r[`on${s}`];a&&a.apply(r,n);const i=o(s).concat(o("*"));for(let e=0;e<i.length;e++){i[e].apply(r,n)}},_has:e=>!(!n[e]&&!r[`on${e}`])};return t&&(r.listeners=t=>e(o(t)),r.on=r.addEventListener,r.off=r.removeEventListener,r.fire=r.dispatchEvent,r.once=function(e,t){var n=function(){return r.off(e,n),t.apply(null,arguments)};return r.on(e,n)},r.destroy=()=>n={}),r};var p=function(e,t){let n;switch(null==t&&(t={}),typeof e){case"object":var o=[];for(let t in e){const r=e[t];n=t.toLowerCase(),o.push(`${n}:\t${r}`)}return o.join("\n")+"\n";case"string":o=e.split("\n");for(let e of Array.from(o))if(/([^:]+):\s*(.+)/.test(e)){n=null!=RegExp.$1?RegExp.$1.toLowerCase():void 0;const e=RegExp.$2;null==t[n]&&(t[n]=e)}return t}return[]};const h=f(!0),v=e=>void 0===e?null:e,y=r.XMLHttpRequest,E=function(){const e=new y,t={};let n,r,s,c=null;var d=0;const E=function(){if(s.status=c||e.status,-1===c&&o<10||(s.statusText=e.statusText),-1===c);else{const t=p(e.getAllResponseHeaders());for(let e in t){const n=t[e];if(!s.headers[e]){const t=e.toLowerCase();s.headers[t]=n}}}},g=function(){b.status=s.status,b.statusText=s.statusText},m=function(){n||b.dispatchEvent("load",{}),b.dispatchEvent("loadend",{}),n&&(b.readyState=0)},x=function(e){for(;e>d&&d<4;)b.readyState=++d,1===d&&b.dispatchEvent("loadstart",{}),2===d&&g(),4===d&&(g(),"text"in s&&(b.responseText=s.text),"xml"in s&&(b.responseXML=s.xml),"data"in s&&(b.response=s.data),"finalUrl"in s&&(b.responseURL=s.finalUrl)),b.dispatchEvent("readystatechange",{}),4===d&&(!1===t.async?m():setTimeout(m,0))},L=function(e){if(4!==e)return void x(e);const n=h.listeners("after");var o=function(){if(n.length>0){const e=n.shift();2===e.length?(e(t,s),o()):3===e.length&&t.async?e(t,s,o):o()}else x(4)};o()};var b=f();t.xhr=b,e.onreadystatechange=function(t){try{2===e.readyState&&E()}catch(e){}4===e.readyState&&(r=!1,E(),function(){if(e.responseType&&"text"!==e.responseType)"document"===e.responseType?(s.xml=e.responseXML,s.data=e.responseXML):s.data=e.response;else{s.text=e.responseText,s.data=e.responseText;try{s.xml=e.responseXML}catch(e){}}"responseURL"in e&&(s.finalUrl=e.responseURL)}()),L(e.readyState)};const w=function(){n=!0};b.addEventListener("error",w),b.addEventListener("timeout",w),b.addEventListener("abort",w),b.addEventListener("progress",(function(t){d<3?L(3):e.readyState<=3&&b.dispatchEvent("readystatechange",{})})),"withCredentials"in e&&(b.withCredentials=!1),b.status=0;for(let e of Array.from(i.concat(a)))b[`on${e}`]=null;if(b.open=function(e,o,a,i,c){d=0,n=!1,r=!1,t.headers={},t.headerNames={},t.status=0,t.method=e,t.url=o,t.async=!1!==a,t.user=i,t.pass=c,s={},s.headers={},L(1)},b.send=function(n){let o,c;for(o of["type","timeout","withCredentials"])c="type"===o?"responseType":o,c in b&&(t[o]=b[c]);t.body=n;const d=h.listeners("before");var f=function(){if(!d.length)return function(){for(o of(l(i,e,b),b.upload&&l(i.concat(a),e.upload,b.upload),r=!0,e.open(t.method,t.url,t.async,t.user,t.pass),["type","timeout","withCredentials"]))c="type"===o?"responseType":o,o in t&&(e[c]=t[o]);for(let n in t.headers){const o=t.headers[n];n&&e.setRequestHeader(n,o)}e.send(t.body)}();const n=function(e){if("object"==typeof e&&("number"==typeof e.status||"number"==typeof s.status))return u(e,s),"data"in e||(e.data=e.response||e.text),void L(4);f()};n.head=function(e){u(e,s),L(2)},n.progress=function(e){u(e,s),L(3)};const p=d.shift();1===p.length?n(p(t)):2===p.length&&t.async?p(t,n):n()};f()},b.abort=function(){c=-1,r?e.abort():b.dispatchEvent("abort",{})},b.setRequestHeader=function(e,n){const o=null!=e?e.toLowerCase():void 0,r=t.headerNames[o]=t.headerNames[o]||e;t.headers[r]&&(n=t.headers[r]+", "+n),t.headers[r]=n},b.getResponseHeader=e=>v(s.headers[e?e.toLowerCase():void 0]),b.getAllResponseHeaders=()=>v(p(s.headers)),e.overrideMimeType&&(b.overrideMimeType=function(){e.overrideMimeType.apply(e,arguments)}),e.upload){let e=f();b.upload=e,t.upload=e}return b.UNSENT=0,b.OPENED=1,b.HEADERS_RECEIVED=2,b.LOADING=3,b.DONE=4,b.response="",b.responseText="",b.responseXML=null,b.readyState=0,b.statusText="",b};E.UNSENT=0,E.OPENED=1,E.HEADERS_RECEIVED=2,E.LOADING=3,E.DONE=4;var g={patch(){y&&(r.XMLHttpRequest=E)},unpatch(){y&&(r.XMLHttpRequest=y)},Native:y,_XH:E};const m=r.fetch,x=function(e,t){null==t&&(t={headers:{}});let n=null;e instanceof Request?n=e:t.url=e;const o=h.listeners("before"),r=h.listeners("after");return new Promise((function(e,s){let a=e;const i=function(){return t.headers&&(t.headers=new Headers(t.headers)),n||(n=new Request(t.url,t)),u(t,n)};var c=function(e){if(!r.length)return a(e);const t=r.shift();return 2===t.length?(t(i(),e),c(e)):3===t.length?t(i(),e,c):c(e)};const l=function(t){if(void 0!==t){const n=new Response(t.body||t.text,t);return e(n),void c(n)}d()};var d=function(){if(!o.length)return void f();const e=o.shift();return 1===e.length?l(e(t)):2===e.length?e(i(),l):void 0},f=()=>m(i()).then((e=>c(e))).catch((function(e){return a=s,c(e),s(e)}));d()}))};var L={patch(){m&&(r.fetch=x)},unpatch(){m&&(r.fetch=m)},Native:m,_XH:x};const b=h;return b.EventEmitter=f,b.before=function(e,t){if(e.length<1||e.length>2)throw"invalid hook";return b.on("before",e,t)},b.after=function(e,t){if(e.length<2||e.length>3)throw"invalid hook";return b.on("after",e,t)},b.enable=function(){g.patch(),L.patch()},b.disable=function(){g.unpatch(),L.unpatch()},b.XMLHttpRequest=g.Native,b.fetch=L.Native,b.headers=p,b.enable(),b}();

    function form2json(params) {
        const pairs = params.split('&');
        const result = {};
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i].split('=');
            const key = decodeURIComponent(pair[0]);
            const value = decodeURIComponent(pair[1]);
            const is_array = /\[\]$/.test(key);
            const dict_match = key.match(/^(.+)\[([^\]]+)\]$/);

            if (dict_match) {
                const k = dict_match[1];
                const subk = dict_match[2];
                result[k] = result[k] || {};
                result[k][subk] = value;
            }
            else if (is_array) {
                const k = key.substring(0, key.length-2);
                result[k] = result[k] || [];
                result[k].push(value);
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }

    function is_hcaptcha(req) {
        return req.method === 'POST' && req.url.startsWith('https://hcaptcha.com/checkcaptcha/');
    }

    function consolidate(simulated, actual) {
        const r = {md: [], mm: [], mu: []};
        for (const e of simulated) {
            for (const k of Object.keys(r)) {
                const t = r[k].length === 0 ? 0 : r[k][r[k].length-1][2];
                const v = e[k].map(x => [
                    Math.ceil(x[0]),
                    Math.ceil(x[1]),
                    Math.ceil(x[2] + t),
                ]);
                r[k].push(...v);
            }
        }
        for (const k of Object.keys(r)) {
            const delta = [];
            let v = null;
            for (const e of r[k]) {
                if (v !== null) {
                    delta.push(e[2] - v);
                }
                v = e[2];
            }
            r[`${k}-mp`] = delta.reduce((a, b) => a + b) / delta.length;
        }
        return r;
    }

    function add_ts(r, ts, max=null) {
        const rr = JSON.parse(JSON.stringify(r));
        for (const k of Object.keys(rr)) {
            if (k.endsWith('-mp')) {
                continue;
            }
            const a = [];
            for (let i = 0; i < rr[k].length; i++) {
                const t = rr[k][i][2] + ts;
                if (max !== null && t >= max) {
                    continue;
                }
                a.push([rr[k][i][0], rr[k][i][1], t]);
            }
            rr[k] = a;
        }
        return rr;
    }

    function merge(original, overwrite) {
        for (const k of Object.keys(overwrite)) {
            original[k] = overwrite[k];
        }
    }

    let metadata = [];
    window.addEventListener('message', event => {
        if (event.data.event === 'nopecha_content') {
            metadata.push(event.data.metadata);
        }
    });
    window.postMessage({event: 'nopecha_hook'});

    xh.before(r => {
        if (is_hcaptcha(r)) {
            const data = JSON.parse(r.body);
            const md = JSON.parse(data.motionData);
            const c = consolidate(metadata, md);
            merge(md, add_ts(c, md.st));
            merge(md.topLevel, add_ts(c, md.topLevel.st, md.st));
            data.motionData = JSON.stringify(md);
            r.body = JSON.stringify(data);
            metadata = [];
        }
    });
})();
