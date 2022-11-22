(async () => {
    !function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.CssSelectorGenerator=e():t.CssSelectorGenerator=e()}(self,(()=>(()=>{"use strict";var t,e,n={d:(t,e)=>{for(var o in e)n.o(e,o)&&!n.o(t,o)&&Object.defineProperty(t,o,{enumerable:!0,get:e[o]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r:t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}},o={};function r(t){return t&&t instanceof Element}function i(t="unknown problem",...e){console.warn(`CssSelectorGenerator: ${t}`,...e)}n.r(o),n.d(o,{default:()=>z,getCssSelector:()=>U}),function(t){t.NONE="none",t.DESCENDANT="descendant",t.CHILD="child"}(t||(t={})),function(t){t.id="id",t.class="class",t.tag="tag",t.attribute="attribute",t.nthchild="nthchild",t.nthoftype="nthoftype"}(e||(e={}));const c={selectors:[e.id,e.class,e.tag,e.attribute],includeTag:!1,whitelist:[],blacklist:[],combineWithinSelector:!0,combineBetweenSelectors:!0,root:null,maxCombinations:Number.POSITIVE_INFINITY,maxCandidates:Number.POSITIVE_INFINITY};function u(t){return t instanceof RegExp}function s(t){return["string","function"].includes(typeof t)||u(t)}function l(t){return Array.isArray(t)?t.filter(s):[]}function a(t){const e=[Node.DOCUMENT_NODE,Node.DOCUMENT_FRAGMENT_NODE,Node.ELEMENT_NODE];return function(t){return t instanceof Node}(t)&&e.includes(t.nodeType)}function f(t,e){if(a(t))return t.contains(e)||i("element root mismatch","Provided root does not contain the element. This will most likely result in producing a fallback selector using element's real root node. If you plan to use the selector using provided root (e.g. `root.querySelector`), it will nto work as intended."),t;const n=e.getRootNode({composed:!1});return a(n)?(n!==document&&i("shadow root inferred","You did not provide a root and the element is a child of Shadow DOM. This will produce a selector using ShadowRoot as a root. If you plan to use the selector using document as a root (e.g. `document.querySelector`), it will not work as intended."),n):e.ownerDocument.querySelector(":root")}function d(t){return"number"==typeof t?t:Number.POSITIVE_INFINITY}function m(t=[]){const[e=[],...n]=t;return 0===n.length?e:n.reduce(((t,e)=>t.filter((t=>e.includes(t)))),e)}function p(t){return[].concat(...t)}function h(t){const e=t.map((t=>{if(u(t))return e=>t.test(e);if("function"==typeof t)return e=>{const n=t(e);return"boolean"!=typeof n?(i("pattern matcher function invalid","Provided pattern matching function does not return boolean. It's result will be ignored.",t),!1):n};if("string"==typeof t){const e=new RegExp("^"+t.replace(/[|\\{}()[\]^$+?.]/g,"\\$&").replace(/\*/g,".+")+"$");return t=>e.test(t)}return i("pattern matcher invalid","Pattern matching only accepts strings, regular expressions and/or functions. This item is invalid and will be ignored.",t),()=>!1}));return t=>e.some((e=>e(t)))}function g(t,e,n){const o=Array.from(f(n,t[0]).querySelectorAll(e));return o.length===t.length&&t.every((t=>o.includes(t)))}function y(t,e){e=null!=e?e:function(t){return t.ownerDocument.querySelector(":root")}(t);const n=[];let o=t;for(;r(o)&&o!==e;)n.push(o),o=o.parentElement;return n}function b(t,e){return m(t.map((t=>y(t,e))))}const N={[t.NONE]:{type:t.NONE,value:""},[t.DESCENDANT]:{type:t.DESCENDANT,value:" > "},[t.CHILD]:{type:t.CHILD,value:" "}},S=new RegExp(["^$","\\s"].join("|")),E=new RegExp(["^$"].join("|")),w=[e.nthoftype,e.tag,e.id,e.class,e.attribute,e.nthchild],v=h(["class","id","ng-*"]);function C({nodeName:t}){return`[${t}]`}function O({nodeName:t,nodeValue:e}){return`[${t}='${L(e)}']`}function T(t){const e=Array.from(t.attributes).filter((e=>function({nodeName:t},e){const n=e.tagName.toLowerCase();return!(["input","option"].includes(n)&&"value"===t||v(t))}(e,t)));return[...e.map(C),...e.map(O)]}function I(t){return(t.getAttribute("class")||"").trim().split(/\s+/).filter((t=>!E.test(t))).map((t=>`.${L(t)}`))}function x(t){const e=t.getAttribute("id")||"",n=`#${L(e)}`,o=t.getRootNode({composed:!1});return!S.test(e)&&g([t],n,o)?[n]:[]}function j(t){const e=t.parentNode;if(e){const n=Array.from(e.childNodes).filter(r).indexOf(t);if(n>-1)return[`:nth-child(${n+1})`]}return[]}function A(t){return[L(t.tagName.toLowerCase())]}function D(t){const e=[...new Set(p(t.map(A)))];return 0===e.length||e.length>1?[]:[e[0]]}function $(t){const e=D([t])[0],n=t.parentElement;if(n){const o=Array.from(n.children).filter((t=>t.tagName.toLowerCase()===e)),r=o.indexOf(t);if(r>-1)return[`${e}:nth-of-type(${r+1})`]}return[]}function R(t=[],{maxResults:e=Number.POSITIVE_INFINITY}={}){const n=[];let o=0,r=k(1);for(;r.length<=t.length&&o<e;)o+=1,n.push(r.map((e=>t[e]))),r=P(r,t.length-1);return n}function P(t=[],e=0){const n=t.length;if(0===n)return[];const o=[...t];o[n-1]+=1;for(let t=n-1;t>=0;t--)if(o[t]>e){if(0===t)return k(n+1);o[t-1]++,o[t]=o[t-1]+1}return o[n-1]>e?k(n+1):o}function k(t=1){return Array.from(Array(t).keys())}const _=":".charCodeAt(0).toString(16).toUpperCase(),M=/[ !"#$%&'()\[\]{|}<>*+,./;=?@^`~\\]/;function L(t=""){var e,n;return null!==(n=null===(e=null===CSS||void 0===CSS?void 0:CSS.escape)||void 0===e?void 0:e.call(CSS,t))&&void 0!==n?n:function(t=""){return t.split("").map((t=>":"===t?`\\${_} `:M.test(t)?`\\${t}`:escape(t).replace(/%/g,"\\"))).join("")}(t)}const q={tag:D,id:function(t){return 0===t.length||t.length>1?[]:x(t[0])},class:function(t){return m(t.map(I))},attribute:function(t){return m(t.map(T))},nthchild:function(t){return m(t.map(j))},nthoftype:function(t){return m(t.map($))}},F={tag:A,id:x,class:I,attribute:T,nthchild:j,nthoftype:$};function V(t){return t.includes(e.tag)||t.includes(e.nthoftype)?[...t]:[...t,e.tag]}function Y(t={}){const n=[...w];return t[e.tag]&&t[e.nthoftype]&&n.splice(n.indexOf(e.tag),1),n.map((e=>{return(o=t)[n=e]?o[n].join(""):"";var n,o})).join("")}function B(t,e,n="",o){const r=function(t,e){return""===e?t:function(t,e){return[...t.map((t=>e+" "+t)),...t.map((t=>e+" > "+t))]}(t,e)}(function(t,e,n){const o=function(t,e){const{blacklist:n,whitelist:o,combineWithinSelector:r,maxCombinations:i}=e,c=h(n),u=h(o);return function(t){const{selectors:e,includeTag:n}=t,o=[].concat(e);return n&&!o.includes("tag")&&o.push("tag"),o}(e).reduce(((e,n)=>{const o=function(t,e){var n;return(null!==(n=q[e])&&void 0!==n?n:()=>[])(t)}(t,n),s=function(t=[],e,n){return t.filter((t=>n(t)||!e(t)))}(o,c,u),l=function(t=[],e){return t.sort(((t,n)=>{const o=e(t),r=e(n);return o&&!r?-1:!o&&r?1:0}))}(s,u);return e[n]=r?R(l,{maxResults:i}):l.map((t=>[t])),e}),{})}(t,n),r=function(t,e){return function(t){const{selectors:e,combineBetweenSelectors:n,includeTag:o,maxCandidates:r}=t,i=n?R(e,{maxResults:r}):e.map((t=>[t]));return o?i.map(V):i}(e).map((e=>function(t,e){const n={};return t.forEach((t=>{const o=e[t];o.length>0&&(n[t]=o)})),function(t={}){let e=[];return Object.entries(t).forEach((([t,n])=>{e=n.flatMap((n=>0===e.length?[{[t]:n}]:e.map((e=>Object.assign(Object.assign({},e),{[t]:n})))))})),e}(n).map(Y)}(e,t))).filter((t=>t.length>0))}(o,n),i=p(r);return[...new Set(i)]}(t,o.root,o),n);for(const e of r)if(g(t,e,o.root))return e;return null}function G(t){return{value:t,include:!1}}function W({selectors:t,operator:n}){let o=[...w];t[e.tag]&&t[e.nthoftype]&&(o=o.filter((t=>t!==e.tag)));let r="";return o.forEach((e=>{(t[e]||[]).forEach((({value:t,include:e})=>{e&&(r+=t)}))})),n.value+r}function H(n){return[":root",...y(n).reverse().map((n=>{const o=function(e,n,o=t.NONE){const r={};return n.forEach((t=>{Reflect.set(r,t,function(t,e){return F[e](t)}(e,t).map(G))})),{element:e,operator:N[o],selectors:r}}(n,[e.nthchild],t.DESCENDANT);return o.selectors.nthchild.forEach((t=>{t.include=!0})),o})).map(W)].join("")}function U(t,n={}){const o=function(t){const e=(Array.isArray(t)?t:[t]).filter(r);return[...new Set(e)]}(t),i=function(t,n={}){const o=Object.assign(Object.assign({},c),n);return{selectors:(r=o.selectors,Array.isArray(r)?r.filter((t=>{return n=e,o=t,Object.values(n).includes(o);var n,o})):[]),whitelist:l(o.whitelist),blacklist:l(o.blacklist),root:f(o.root,t),combineWithinSelector:!!o.combineWithinSelector,combineBetweenSelectors:!!o.combineBetweenSelectors,includeTag:!!o.includeTag,maxCombinations:d(o.maxCombinations),maxCandidates:d(o.maxCandidates)};var r}(o[0],n);let u="",s=i.root;function a(){return function(t,e,n="",o){if(0===t.length)return null;const r=[t.length>1?t:[],...b(t,e).map((t=>[t]))];for(const t of r){const e=B(t,0,n,o);if(e)return{foundElements:t,selector:e}}return null}(o,s,u,i)}let m=a();for(;m;){const{foundElements:t,selector:e}=m;if(g(o,e,i.root))return e;s=t[0],u=e,m=a()}return o.length>1?o.map((t=>U(t,i))).join(", "):function(t){return t.map(H).join(", ")}(o)}const z=U;return o})()));


    function is_iframe() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }


    class NopechaSelector {
        constructor(locate, draw_mark=false) {
            this.NAMESPACE = '__NOPECHA__';
            this.MARK_RADIUS = 5;

            this.window_id = Util.generate_id(8);
            this.locate = locate;
            this.draw_mark = draw_mark;
            this.update_timer;
            this.css_selector;
            this.$last;

            this.initialize_style();
            this.initialize_elements();
        }

        initialize_style() {
            const CSS = [
                `#${this.NAMESPACE}_wrapper {
                    position: fixed;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background-color: transparent;
                    pointer-events: none;
                    z-index: 10000000;
                }`,
                // Header & footer
                `.${this.NAMESPACE}_textbox {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;

                    position: absolute;
                    left: 0;
                    right: 0;

                    background-color: rgba(0, 0, 0, 1);
                    color: #fff;
                    font: normal 12px/12px Helvetica, sans-serif;
                    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
                    border: 1px solid #fff;
                    overflow: hidden;
                }`,
                // Header
                `.${this.NAMESPACE}_textbox.${this.NAMESPACE}_header {
                    top: 0;
                }`,
                `.${this.NAMESPACE}_textbox.${this.NAMESPACE}_header > div {
                    padding: 4px 8px;
                }`,
                `.${this.NAMESPACE}_textbox.${this.NAMESPACE}_header > div:first-child {
                    flex-grow: 1;
                }`,
                // Footer
                `.${this.NAMESPACE}_textbox.${this.NAMESPACE}_footer {
                    bottom: 0;
                }`,
                `.${this.NAMESPACE}_textbox.${this.NAMESPACE}_footer > div {
                    padding: 4px 8px;
                }`,
                `.${this.NAMESPACE}_textbox.${this.NAMESPACE}_footer > div:first-child {
                    flex-grow: 1;
                }`,
                // Highlight
                `.${this.NAMESPACE}_highlight {
                    position: absolute;
                    opacity: 0.4;
                }`,
                `.${this.NAMESPACE}_highlight.${this.NAMESPACE}_margin {
                    background-color: rgb(230, 165, 18);
                }`,
                `.${this.NAMESPACE}_highlight.${this.NAMESPACE}_border {
                    background-color: rgb(255, 204, 121);
                }`,
                `.${this.NAMESPACE}_highlight.${this.NAMESPACE}_padding {
                    background-color: rgb(50, 255, 50);
                }`,
                `.${this.NAMESPACE}_highlight.${this.NAMESPACE}_content {
                    background-color: rgb(0, 153, 201);
                }`,
                // Center mark
                `.${this.NAMESPACE}_mark {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;

                    width: ${parseInt(this.MARK_RADIUS*2)}px;
                    height: ${parseInt(this.MARK_RADIUS*2)}px;
                    background-color: #f44;
                    border-radius: 50%;
                    z-index: 2;
                }`,
            ];

            if (!is_iframe()) {
                CSS.push(`.${this.NAMESPACE}_shadow {
                    position: fixed;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background-color: rgba(0, 0, 0, 0.2);
                    pointer-events: none;
                    z-index: 1;
                }`);
            }

            this.$style = document.createElement('style');
            this.$style.type = 'text/css';
            if (this.$style.styleSheet) {
                this.$style.styleSheet.cssText = CSS.join('\n');  // IE
            }
            else {
                this.$style.innerHTML = CSS.join('\n');
            }
            document.getElementsByTagName('head')[0].appendChild(this.$style);
        }

        initialize_elements() {
            this.$wrapper = document.createElement('div');
            this.$wrapper.id = `${this.NAMESPACE}_wrapper`;
            document.body.append(this.$wrapper);

            this.$shadow = document.createElement('div');
            this.$shadow.classList.add(`${this.NAMESPACE}_shadow`);
            this.$wrapper.append(this.$shadow);

            this.$margin_box = document.createElement('div');
            this.$margin_box.classList.add(`${this.NAMESPACE}_highlight`, `${this.NAMESPACE}_margin`);
            this.$wrapper.append(this.$margin_box);

            this.$border_box = document.createElement('div');
            this.$border_box.classList.add(`${this.NAMESPACE}_highlight`, `${this.NAMESPACE}_border`);
            this.$wrapper.append(this.$border_box);

            this.$padding_box = document.createElement('div');
            this.$padding_box.classList.add(`${this.NAMESPACE}_highlight`, `${this.NAMESPACE}_padding`);
            this.$wrapper.append(this.$padding_box);

            this.$content_box = document.createElement('div');
            this.$content_box.classList.add(`${this.NAMESPACE}_highlight`, `${this.NAMESPACE}_content`);
            this.$wrapper.append(this.$content_box);

            if (!is_iframe()) {
                this.$header = document.createElement('div');
                this.$header.classList.add(`${this.NAMESPACE}_textbox`, `${this.NAMESPACE}_header`);
                const etype = this.locate === 'textcaptcha_image_selector' ? '<b>Image</b>' : '<b>Input</b>';
                this.$header.innerHTML = `
                    <div>
                        <div>Click on the CAPTCHA ${etype} element to generate a CSS selector.</div>
                        <div>Press <b>ESC</b> to cancel.</div>
                    </div>
                    <div><b>NopeCHA</b></div>
                `;
                this.$wrapper.append(this.$header);

                this.$footer = document.createElement('div');
                this.$footer.classList.add(`${this.NAMESPACE}_textbox`, `${this.NAMESPACE}_footer`);
                this.$wrapper.append(this.$footer);
            }


            if (this.draw_mark) {
                this.$mark = document.createElement('div');
                this.$mark.classList.add(`${this.NAMESPACE}_mark`);
                this.$wrapper.append(this.$mark);
            }
        }

        clip(pos) {
            const clipped = {
                top: Math.max(0, pos.top),
                left: Math.max(0, pos.left),
                width: (pos.width + pos.left > window.innerWidth) ? (window.innerWidth - pos.left) : pos.width,
                height: (pos.height + pos.top > window.innerHeight) ? (window.innerHeight - pos.top) : pos.height,
            };

            if (pos.top < 0) {
                clipped.height += pos.top;
            }
            if (pos.left < 0) {
                clipped.width += pos.left;
            }

            if (clipped.width < 0) {
                clipped.width = 0;
            }
            if (clipped.height < 0) {
                clipped.height = 0;
            }
            return clipped;
        }

        computed_style($t, style) {
            let dim = window.getComputedStyle($t).getPropertyValue(style);
            dim = dim.match(/[\-]?[\d\.]+px/g);
            for (const i in dim) {
                dim[i] = parseFloat(dim[i].replace('px', ''));
            }
            if (dim.length === 1) {
                dim.push(dim[0], dim[0], dim[0]);
            }
            if (dim.length === 2) {
                dim.push(dim[0], dim[1]);
            }
            if (dim.length === 3) {
                dim.push(dim[1]);
            }
            return dim;
        }

        add_dim(dim, arrs) {
            for (const arr of arrs) {
                dim.top -= arr[0];
                dim.left -= arr[3];
                dim.width += (arr[1] + arr[3]);
                dim.height += (arr[0] + arr[2]);
            }
            return dim;
        }

        sub_dim(dim, arrs) {
            for (const arr of arrs) {
                dim.top += arr[0];
                dim.left += arr[3];
                dim.width -= (arr[1] + arr[3]);
                dim.height -= (arr[0] + arr[2]);
            }
            return dim;
        }

        set_dim($t, dim) {
            const p = this.clip(dim);
            $t.style.top = `${p.top}px`;
            $t.style.left = `${p.left}px`;
            $t.style.width = `${p.width}px`;
            $t.style.height = `${p.height}px`;
        }

        get_center($t) {
            const p = $t.getBoundingClientRect();
            const center = {
                x: p.left + p.width/2,
                y: p.top + p.height/2,
            };
            return center;
        }

        get_css() {
            return window.CssSelectorGenerator.getCssSelector(this.$t);
        }

        clear() {
            this.$t = null;
            const no_box = {
                top: 0,
                left: 0,
                width: 0,
                height: 0,
            };
            this.set_dim(this.$margin_box, no_box);
            this.set_dim(this.$border_box, no_box);
            this.set_dim(this.$padding_box, no_box);
            this.set_dim(this.$content_box, no_box);

            if (this.draw_mark) {
                this.$mark.style.top = '0px';
                this.$mark.style.left = '0px';
            }
        }

        update($t, delay=0) {
            const self = this;
            if (self.$last && self.$last === $t) {
                return;
            }
            if ($t) {
                self.$t = $t;
            }
            if (!self.$t) {
                return;
            }

            clearTimeout(self.update_timer);
            self.update_timer = setTimeout(() => {
                if (!self.$t?.getBoundingClientRect) {
                    return;
                }

                const r = self.$t.getBoundingClientRect();

                const margin = self.computed_style(self.$t, 'margin');
                const border = self.computed_style(self.$t, 'border-width');
                const padding = self.computed_style(self.$t, 'padding');

                const box = {
                    top: r.top,
                    left: r.left,
                    width: r.width,
                    height: r.height,
                };
                const margin_box = JSON.parse(JSON.stringify(box));
                const border_box = JSON.parse(JSON.stringify(box));
                const padding_box = JSON.parse(JSON.stringify(box));
                const content_box = JSON.parse(JSON.stringify(box));

                self.add_dim(margin_box, [margin]);
                self.sub_dim(padding_box, [border]);
                self.sub_dim(content_box, [border, padding]);

                self.set_dim(self.$margin_box, margin_box);
                self.set_dim(self.$border_box, border_box);
                self.set_dim(self.$padding_box, padding_box);
                self.set_dim(self.$content_box, content_box);

                const css_selector = self.get_css(self.$t);
                self.update_css_selector(self.window_id, css_selector);
                BG.exec('Relay.send', {data: {action: 'update_locate', window_id: self.window_id, css_selector}});

                if (self.draw_mark) {
                    const center = self.get_center($t);
                    self.$mark.style.top = `${parseInt(center.y-self.MARK_RADIUS)}px`;
                    self.$mark.style.left = `${parseInt(center.x-self.MARK_RADIUS)}px`;
                }
            }, delay);
        }

        update_css_selector(frame_id, css_selector) {
            if (this.window_id !== frame_id) {
                this.clear();
            }
            if (!is_iframe()) {
                this.$footer.innerHTML = `<div>${css_selector}</div>`;
            }
        }

        terminate() {
            clearTimeout(this.update_timer);
            this.$style.remove();
            this.$wrapper.remove();
        }
    }


    let nopecha_selector = null;


    function on_click(event) {
        // Save the selected element
        const $e = event.target;
        const selector = nopecha_selector.get_css($e);
        BG.exec('Settings.set', {id: nopecha_selector.locate, value: selector});
        stop(true);
    }

    function on_mousemove(event) {
        // Update highlight overlay when new element is targeted
        const $e = event.target;
        nopecha_selector.update($e);
    }

    function on_mousewheel(event) {
        // Update highlight overlay when page is scrolled
        nopecha_selector.update();
    }

    function on_keydown(event) {
        // Stop on escape
        event = event || window.event;

        let is_esc = false;
        if ('key' in event) {
            is_esc = (event.key === 'Escape' || event.key === 'Esc');
        }
        else {
            is_esc = (event.keyCode === 27);
        }

        if (is_esc) {
            stop(true);
        }
    }

    function start(locate) {
        nopecha_selector = new NopechaSelector(locate);
        document.body.addEventListener('click', on_click);
        document.body.addEventListener('mousemove', on_mousemove);
        document.body.addEventListener('mousewheel', on_mousewheel);
        document.body.addEventListener('keydown', on_keydown);
    }

    function stop(broadcast) {
        try {
            document.body.removeEventListener('click', on_click);
            document.body.removeEventListener('mousemove', on_mousemove);
            document.body.removeEventListener('mousewheel', on_mousewheel);
            document.body.removeEventListener('keydown', on_keydown);
            nopecha_selector.terminate();
            nopecha_selector = null;
        } catch (e) {}

        if (broadcast) {
            BG.exec('Relay.send', {data: {action: 'stop_locate'}});
        }
    }

    chrome.runtime.onMessage.addListener((req, sender, send) => {
        if (req.action === 'start_locate') {
            start(req.locate);
        }
        else if (req.action === 'stop_locate') {
            stop(false);
        }
        else if (req.action === 'update_locate') {
            nopecha_selector.update_css_selector(req.window_id, req.css_selector);
        }
    });
})();
