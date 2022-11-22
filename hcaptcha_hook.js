(() => {
    const _xh = (function () {
        'use strict';

        if (!Array.prototype.indexOf) {
            Array.prototype.indexOf = function(item) {
                for (let i = 0; i < this.length; i++) {
                    const x = this[i];
                    if (x === item) {
                        return i;
                    }
                }
                return -1;
            };
        }
        const slice = (o, n) => Array.prototype.slice.call(o, n);

        let result = null;
        if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
            result = self;
        }
        else if (typeof global !== 'undefined') {
            result = global;
        }
        else if (window) {
            result = window;
        }
        const window_ref = result;
        const document_ref = result.document;

        const useragent = typeof navigator !== 'undefined' && navigator['useragent'] ? navigator.userAgent : '';
        let msie = null;
        if (/msie (\d+)/.test(useragent.toLowerCase()) || /trident\/.*; rv:(\d+)/.test(useragent.toLowerCase())) {
            msie = parseInt(RegExp.$1, 10);
        }

        const UPLOAD_EVENTS = ['load', 'loadend', 'loadstart'];
        const COMMON_EVENTS = ['progress', 'abort', 'error', 'timeout'];

        const deprecated_prop = p => ['returnValue', 'totalSize', 'position'].includes(p);

        const merge_objects = function(src, dst) {
            for (let k in src) {
                if (deprecated_prop(k)) {
                    continue;
                }
                const v = src[k];
                try {
                    dst[k] = v;
                } catch (error) {}
            }
            return dst;
        };

        const proxy_events = function(events, src, dst) {
            const p = event => function(e) {
                const clone = {};
                for (let k in e) {
                    if (deprecated_prop(k)) {
                        continue;
                    }
                    const val = e[k];
                    clone[k] = val === src ? dst : val;
                }
                return dst.dispatchEvent(event, clone);
            };
            for (let event of Array.from(events)) {
                if (dst._has(event)) {
                    src[`on${event}`] = p(event);
                }
            }
        };

        const fake_event = function(type) {
            if (document_ref && document_ref.createEventObject != null) {
                const msieEventObject = document_ref.createEventObject();
                msieEventObject.type = type;
                return msieEventObject;
            }
            try {
                return new Event(type);
            } catch (error) {
                return { type };
            }
        };

        const EventEmitter = function(node_style) {
            let events = {};
            const listeners = event => events[event] || [];
            const emitter = {};
            emitter.addEventListener = function(event, callback, i) {
                events[event] = listeners(event);
                if (events[event].indexOf(callback) >= 0) {
                    return;
                }
                i = i === undefined ? events[event].length : i;
                events[event].splice(i, 0, callback);
            };
            emitter.removeEventListener = function(event, callback) {
                if (event === undefined) {
                    events = {};
                    return;
                }
                if (callback === undefined) {
                    events[event] = [];
                }
                const i = listeners(event).indexOf(callback);
                if (i === -1) {
                    return;
                }
                listeners(event).splice(i, 1);
            };
            emitter.dispatchEvent = function() {
                const args = slice(arguments);
                const event = args.shift();
                if (!node_style) {
                    args[0] = merge_objects(args[0], fake_event(event));
                }
                const legacylistener = emitter[`on${event}`];
                if (legacylistener) {
                    legacylistener.apply(emitter, args);
                }
                const iterable = listeners(event).concat(listeners('*'));
                for (let i = 0; i < iterable.length; i++) {
                    const listener = iterable[i];
                    listener.apply(emitter, args);
                }
            };
            emitter._has = event => !!(events[event] || emitter[`on${event}`]);
            if (node_style) {
                emitter.listeners = event => slice(listeners(event));
                emitter.on = emitter.addEventListener;
                emitter.off = emitter.removeEventListener;
                emitter.fire = emitter.dispatchEvent;
                emitter.once = function(e, fn) {
                    var fire = function() {
                        emitter.off(e, fire);
                        return fn.apply(null, arguments);
                    };
                    return emitter.on(e, fire);
                };
                emitter.destroy = () => (events = {});
            }

            return emitter;
        };

        const convert = function(h, dest) {
            let name;
            if (dest == null) {
                dest = {};
            }
            switch (typeof h) {
                case 'object':
                    var headers = [];
                    for (let k in h) {
                        const v = h[k];
                        name = k.toLowerCase();
                        headers.push(`${name}:\t${v}`);
                    }
                    return headers.join('\n') + '\n';
                case 'string':
                    headers = h.split('\n');
                    for (let header of Array.from(headers)) {
                        if (/([^:]+):\s*(.+)/.test(header)) {
                            name = RegExp.$1 != null ? RegExp.$1.toLowerCase() : undefined;
                            const value = RegExp.$2;
                            if (dest[name] == null) {
                                dest[name] = value;
                            }
                        }
                    }
                    return dest;
            }
            return [];
        };

        var headers = {convert};

        const hooks = EventEmitter(true);

        const nullify = res => (res === undefined ? null : res);

        const Native$1 = window_ref.XMLHttpRequest;

        const XH$1 = function() {
            const ABORTED = -1;
            const xhr = new Native$1();
            const request = {};
            let status = null;
            let hasError = undefined;
            let transiting = undefined;
            let response = undefined;
            var current_state = 0;

            const read_head = function() {
                response.status = status || xhr.status;
                if (status !== ABORTED || !(msie < 10)) {
                    response.statusText = xhr.statusText;
                }
                if (status !== ABORTED) {
                    const object = headers.convert(xhr.getAllResponseHeaders());
                    for (let key in object) {
                        const val = object[key];
                        if (!response.headers[key]) {
                            const name = key.toLowerCase();
                            response.headers[name] = val;
                        }
                    }
                    return;
                }
            };

            const read_body = function() {
                if (!xhr.responseType || xhr.responseType === 'text') {
                    response.text = xhr.responseText;
                    response.data = xhr.responseText;
                    try {
                        response.xml = xhr.responseXML;
                    } catch (error) {}
                }
                else if (xhr.responseType === 'document') {
                    response.xml = xhr.responseXML;
                    response.data = xhr.responseXML;
                }
                else {
                    response.data = xhr.response;
                }
                if ('responseURL' in xhr) {
                    response.finalUrl = xhr.responseURL;
                }
            };

            const write_head = function() {
                facade.status = response.status;
                facade.statusText = response.statusText;
            };

            const write_body = function() {
                if ('text' in response) {
                    facade.responseText = response.text;
                }
                if ('xml' in response) {
                    facade.responseXML = response.xml;
                }
                if ('data' in response) {
                    facade.response = response.data;
                }
                if ('finalUrl' in response) {
                    facade.responseURL = response.finalUrl;
                }
            };

            const emit_final = function() {
                if (!hasError) {
                    facade.dispatchEvent('load', {});
                }
                facade.dispatchEvent('loadend', {});
                if (hasError) {
                    facade.readyState = 0;
                }
            };

            const emit_ready_state = function(n) {
                while (n > current_state && current_state < 4) {
                    facade.readyState = ++current_state;
                    if (current_state === 1) {
                        facade.dispatchEvent('loadstart', {});
                    }
                    if (current_state === 2) {
                        write_head();
                    }
                    if (current_state === 4) {
                        write_head();
                        write_body();
                    }
                    facade.dispatchEvent('readystatechange', {});
                    if (current_state === 4) {
                        if (request.async === false) {
                            emit_final();
                        }
                        else {
                            setTimeout(emit_final, 0);
                        }
                    }
                }
            };

            const set_ready_state = function(n) {
                if (n !== 4) {
                    emit_ready_state(n);
                    return;
                }
                const after_hooks = hooks.listeners('after');
                var process = function() {
                    if (after_hooks.length > 0) {
                        const hook = after_hooks.shift();
                        if (hook.length === 2) {
                            hook(request, response);
                            process();
                        }
                        else if (hook.length === 3 && request.async) {
                            hook(request, response, process);
                        }
                        else {
                            process();
                        }
                    }
                    else {
                        emit_ready_state(4);
                    }
                    return;
                };
                process();
            };

            var facade = EventEmitter();
            request.xhr = facade;

            xhr.onreadystatechange = function(event) {
                try {
                    if (xhr.readyState === 2) {
                        read_head();
                    }
                } catch (error) {}
                if (xhr.readyState === 4) {
                    transiting = false;
                    read_head();
                    read_body();
                }

                set_ready_state(xhr.readyState);
            };

            const has_error_handler = function() {
                hasError = true;
            };
            facade.addEventListener('error', has_error_handler);
            facade.addEventListener('timeout', has_error_handler);
            facade.addEventListener('abort', has_error_handler);
            facade.addEventListener('progress', function(event) {
                if (current_state < 3) {
                    set_ready_state(3);
                }
                else if (xhr.readyState <= 3) {
                    facade.dispatchEvent('readystatechange', {});
                }
            });

            if ('withCredentials' in xhr) {
                facade.withCredentials = false;
            }
            facade.status = 0;

            for (let event of Array.from(COMMON_EVENTS.concat(UPLOAD_EVENTS))) {
                facade[`on${event}`] = null;
            }

            facade.open = function(method, url, async, user, pass) {
                current_state = 0;
                hasError = false;
                transiting = false;
                request.headers = {};
                request.headerNames = {};
                request.status = 0;
                request.method = method;
                request.url = url;
                request.async = async !== false;
                request.user = user;
                request.pass = pass;
                response = {};
                response.headers = {};
                set_ready_state(1);
            };

            facade.send = function(body) {
                let k, modk;
                for (k of ['type', 'timeout', 'withCredentials']) {
                    modk = k === 'type' ? 'responseType' : k;
                    if (modk in facade) {
                        request[k] = facade[modk];
                    }
                }

                request.body = body;
                const send = function() {
                    proxy_events(COMMON_EVENTS, xhr, facade);
                    if (facade.upload) {
                        proxy_events(
                            COMMON_EVENTS.concat(UPLOAD_EVENTS),
                            xhr.upload,
                            facade.upload
                        );
                    }

                    transiting = true;
                    xhr.open(
                        request.method,
                        request.url,
                        request.async,
                        request.user,
                        request.pass
                    );

                    for (k of ['type', 'timeout', 'withCredentials']) {
                        modk = k === 'type' ? 'responseType' : k;
                        if (k in request) {
                            xhr[modk] = request[k];
                        }
                    }

                    for (let header in request.headers) {
                        const value = request.headers[header];
                        if (header) {
                            xhr.setRequestHeader(header, value);
                        }
                    }
                    xhr.send(request.body);
                };

                const before_hooks = hooks.listeners('before');
                var process = function() {
                    if (!before_hooks.length) {
                        return send();
                    }
                    const done = function(userResponse) {
                        if (typeof userResponse === 'object' && (typeof userResponse.status === 'number' || typeof response.status === 'number')) {
                            merge_objects(userResponse, response);
                            if (!('data' in userResponse)) {
                                userResponse.data = userResponse.response || userResponse.text;
                            }
                            set_ready_state(4);
                            return;
                        }
                        process();
                    };
                    done.head = function(userResponse) {
                        merge_objects(userResponse, response);
                        set_ready_state(2);
                    };
                    done.progress = function(userResponse) {
                        merge_objects(userResponse, response);
                        set_ready_state(3);
                    };

                    const hook = before_hooks.shift();
                    if (hook.length === 1) {
                        done(hook(request));
                    }
                    else if (hook.length === 2 && request.async) {
                        hook(request, done);
                    }
                    else {
                        done();
                    }
                    return;
                };
                process();
            };

            facade.abort = function() {
                status = ABORTED;
                if (transiting) {
                    xhr.abort();
                }
                else {
                    facade.dispatchEvent('abort', {});
                }
            };

            facade.setRequestHeader = function(header, value) {
                const lName = header != null ? header.toLowerCase() : undefined;
                const name = (request.headerNames[lName] = request.headerNames[lName] || header);
                if (request.headers[name]) {
                    value = request.headers[name] + ', ' + value;
                }
                request.headers[name] = value;
            };
            facade.getResponseHeader = header => nullify(response.headers[header ? header.toLowerCase() : undefined]);
            facade.getAllResponseHeaders = () => nullify(headers.convert(response.headers));

            if (xhr.overrideMimeType) {
                facade.overrideMimeType = function() {
                    xhr.overrideMimeType.apply(xhr, arguments);
                };
            }

            if (xhr.upload) {
                let up = EventEmitter();
                facade.upload = up;
                request.upload = up;
            }

            facade.UNSENT = 0;
            facade.OPENED = 1;
            facade.HEADERS_RECEIVED = 2;
            facade.LOADING = 3;
            facade.DONE = 4;
            facade.response = '';
            facade.responseText = '';
            facade.responseXML = null;
            facade.readyState = 0;
            facade.statusText = '';

            return facade;
        };

        XH$1.UNSENT = 0;
        XH$1.OPENED = 1;
        XH$1.HEADERS_RECEIVED = 2;
        XH$1.LOADING = 3;
        XH$1.DONE = 4;

        var XMLHttpRequest = {
            patch() {
                if (Native$1) {
                    window_ref.XMLHttpRequest = XH$1;
                }
            },
            unpatch() {
                if (Native$1) {
                    window_ref.XMLHttpRequest = Native$1;
                }
            },
            Native: Native$1,
            XH: XH$1
        };

        const Native = window_ref.fetch;

        const XH = function(url, options) {
            if (options == null) {
                options = {headers: {}};
            }

            let request = null;

            if (url instanceof Request) {
                request = url;
            }
            else {
                options.url = url;
            }

            const before_hooks = hooks.listeners('before');
            const after_hooks = hooks.listeners('after');

            return new Promise(function(resolve, reject) {
                const get_request = function() {
                    if (options.headers) {
                        options.headers = new Headers(options.headers);
                    }
                    if (!request) {
                        request = new Request(options.url, options);
                    }
                    return merge_objects(options, request);
                };

                const process_after = function(response) {
                    if (!after_hooks.length) {
                        return resolve(response);
                    }
                    const hook = after_hooks.shift();
                    if (hook.length === 2) {
                        hook(get_request(), response);
                        return process_after(response);
                    }
                    else if (hook.length === 3) {
                        return hook(get_request(), response, process_after);
                    }
                    else {
                        return process_after(response);
                    }
                };

                const done = function(userResponse) {
                    if (userResponse !== undefined) {
                        const response = new Response(userResponse.body || userResponse.text, userResponse);
                        resolve(response);
                        process_after(response);
                        return;
                    }
                    process_before();
                };

                const process_before = function() {
                    if (!before_hooks.length) {
                        send();
                        return;
                    }

                    const hook = before_hooks.shift();

                    if (hook.length === 1) {
                        return done(hook(options));
                    } else if (hook.length === 2) {
                        return hook(get_request(), done);
                    }
                };

                var send = () => Native(get_request())
                    .then(response => process_after(response))
                    .catch(function(err) {
                        resolve = reject;
                        process_after(err);
                        return reject(err);
                    });

                process_before();
            });
        };

        var fetch = {
            patch() {
                if (Native) {
                    window_ref.fetch = XH;
                }
            },
            unpatch() {
                if (Native) {
                    window_ref.fetch = Native;
                }
            },
            Native,
            XH
        };

        const xh = hooks;
        xh.EventEmitter = EventEmitter;
        xh.before = function(handler, i) {
            if (handler.length < 1 || handler.length > 2) {
                throw 'invalid hook';
            }
            return xh.on('before', handler, i);
        };
        xh.after = function(handler, i) {
            if (handler.length < 2 || handler.length > 3) {
                throw 'invalid hook';
            }
            return xh.on('after', handler, i);
        };
        xh.enable = function() {
            XMLHttpRequest.patch();
            fetch.patch();
        };
        xh.disable = function() {
            XMLHttpRequest.unpatch();
            fetch.unpatch();
        };
        xh.XMLHttpRequest = XMLHttpRequest.Native;
        xh.fetch = fetch.Native;
        xh.headers = headers.convert;
        xh.enable();
        return xh;
    })();


    function is_hcaptcha(req) {
        return req.method === 'POST' && req.url.startsWith('https://hcaptcha.com/checkcaptcha/');
    }


    function build_metadata(metadata) {
        const r = {md: [], mm: [], mu: []};
        for (const e of metadata) {
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
            let mp = 0;
            if (delta.length > 0) {
                mp = delta.reduce((a, b) => a + b) / delta.length;
            }
            r[`${k}-mp`] = mp;
        }
        return r;
    }


    function relative_ts(r, st, max=null) {
        const _r = JSON.parse(JSON.stringify(r));
        for (const k of Object.keys(_r)) {
            if (k.endsWith('-mp')) {
                continue;
            }
            const a = [];
            for (let i = 0; i < _r[k].length; i++) {
                const t = _r[k][i][2] + st;
                if (max !== null && t >= max) {
                    continue;
                }
                a.push([_r[k][i][0], _r[k][i][1], t]);
            }
            _r[k] = a;
        }
        return _r;
    }


    function merge(original, overwrite) {
        for (const k of Object.keys(overwrite)) {
            original[k] = overwrite[k];
        }
    }


    let metadata = [];
    window.addEventListener('message', e => {
        if (e.data.event === 'NopeCHA.metadata') {
            metadata.push(e.data.metadata);
        }
    });
    window.postMessage({event: 'NopeCHA.hook'});


    _xh.before(r => {
        try {
            if (is_hcaptcha(r)) {
                const data = JSON.parse(r.body);
                const md = JSON.parse(data.motionData);
                const c = build_metadata(metadata);
                merge(md, relative_ts(c, md.st));
                merge(md.topLevel, relative_ts(c, md.topLevel.st, md.st));
                data.motionData = JSON.stringify(md);
                r.body = JSON.stringify(data);
                metadata = [];
            }
        } catch (e) {
            console.log('xh error', e);
        }
    });
})();
