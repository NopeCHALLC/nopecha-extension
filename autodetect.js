(async () => {
    !function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.CssSelectorGenerator=e():t.CssSelectorGenerator=e()}(self,(()=>(()=>{"use strict";var t,e,n={d:(t,e)=>{for(var o in e)n.o(e,o)&&!n.o(t,o)&&Object.defineProperty(t,o,{enumerable:!0,get:e[o]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r:t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}},o={};function r(t){return t&&t instanceof Element}function i(t="unknown problem",...e){console.warn(`CssSelectorGenerator: ${t}`,...e)}n.r(o),n.d(o,{default:()=>z,getCssSelector:()=>U}),function(t){t.NONE="none",t.DESCENDANT="descendant",t.CHILD="child"}(t||(t={})),function(t){t.id="id",t.class="class",t.tag="tag",t.attribute="attribute",t.nthchild="nthchild",t.nthoftype="nthoftype"}(e||(e={}));const c={selectors:[e.id,e.class,e.tag,e.attribute],includeTag:!1,whitelist:[],blacklist:[],combineWithinSelector:!0,combineBetweenSelectors:!0,root:null,maxCombinations:Number.POSITIVE_INFINITY,maxCandidates:Number.POSITIVE_INFINITY};function u(t){return t instanceof RegExp}function s(t){return["string","function"].includes(typeof t)||u(t)}function l(t){return Array.isArray(t)?t.filter(s):[]}function a(t){const e=[Node.DOCUMENT_NODE,Node.DOCUMENT_FRAGMENT_NODE,Node.ELEMENT_NODE];return function(t){return t instanceof Node}(t)&&e.includes(t.nodeType)}function f(t,e){if(a(t))return t.contains(e)||i("element root mismatch","Provided root does not contain the element. This will most likely result in producing a fallback selector using element's real root node. If you plan to use the selector using provided root (e.g. `root.querySelector`), it will nto work as intended."),t;const n=e.getRootNode({composed:!1});return a(n)?(n!==document&&i("shadow root inferred","You did not provide a root and the element is a child of Shadow DOM. This will produce a selector using ShadowRoot as a root. If you plan to use the selector using document as a root (e.g. `document.querySelector`), it will not work as intended."),n):e.ownerDocument.querySelector(":root")}function d(t){return"number"==typeof t?t:Number.POSITIVE_INFINITY}function m(t=[]){const[e=[],...n]=t;return 0===n.length?e:n.reduce(((t,e)=>t.filter((t=>e.includes(t)))),e)}function p(t){return[].concat(...t)}function h(t){const e=t.map((t=>{if(u(t))return e=>t.test(e);if("function"==typeof t)return e=>{const n=t(e);return"boolean"!=typeof n?(i("pattern matcher function invalid","Provided pattern matching function does not return boolean. It's result will be ignored.",t),!1):n};if("string"==typeof t){const e=new RegExp("^"+t.replace(/[|\\{}()[\]^$+?.]/g,"\\$&").replace(/\*/g,".+")+"$");return t=>e.test(t)}return i("pattern matcher invalid","Pattern matching only accepts strings, regular expressions and/or functions. This item is invalid and will be ignored.",t),()=>!1}));return t=>e.some((e=>e(t)))}function g(t,e,n){const o=Array.from(f(n,t[0]).querySelectorAll(e));return o.length===t.length&&t.every((t=>o.includes(t)))}function y(t,e){e=null!=e?e:function(t){return t.ownerDocument.querySelector(":root")}(t);const n=[];let o=t;for(;r(o)&&o!==e;)n.push(o),o=o.parentElement;return n}function b(t,e){return m(t.map((t=>y(t,e))))}const N={[t.NONE]:{type:t.NONE,value:""},[t.DESCENDANT]:{type:t.DESCENDANT,value:" > "},[t.CHILD]:{type:t.CHILD,value:" "}},S=new RegExp(["^$","\\s"].join("|")),E=new RegExp(["^$"].join("|")),w=[e.nthoftype,e.tag,e.id,e.class,e.attribute,e.nthchild],v=h(["class","id","ng-*"]);function C({nodeName:t}){return`[${t}]`}function O({nodeName:t,nodeValue:e}){return`[${t}='${L(e)}']`}function T(t){const e=Array.from(t.attributes).filter((e=>function({nodeName:t},e){const n=e.tagName.toLowerCase();return!(["input","option"].includes(n)&&"value"===t||v(t))}(e,t)));return[...e.map(C),...e.map(O)]}function I(t){return(t.getAttribute("class")||"").trim().split(/\s+/).filter((t=>!E.test(t))).map((t=>`.${L(t)}`))}function x(t){const e=t.getAttribute("id")||"",n=`#${L(e)}`,o=t.getRootNode({composed:!1});return!S.test(e)&&g([t],n,o)?[n]:[]}function j(t){const e=t.parentNode;if(e){const n=Array.from(e.childNodes).filter(r).indexOf(t);if(n>-1)return[`:nth-child(${n+1})`]}return[]}function A(t){return[L(t.tagName.toLowerCase())]}function D(t){const e=[...new Set(p(t.map(A)))];return 0===e.length||e.length>1?[]:[e[0]]}function $(t){const e=D([t])[0],n=t.parentElement;if(n){const o=Array.from(n.children).filter((t=>t.tagName.toLowerCase()===e)),r=o.indexOf(t);if(r>-1)return[`${e}:nth-of-type(${r+1})`]}return[]}function R(t=[],{maxResults:e=Number.POSITIVE_INFINITY}={}){const n=[];let o=0,r=k(1);for(;r.length<=t.length&&o<e;)o+=1,n.push(r.map((e=>t[e]))),r=P(r,t.length-1);return n}function P(t=[],e=0){const n=t.length;if(0===n)return[];const o=[...t];o[n-1]+=1;for(let t=n-1;t>=0;t--)if(o[t]>e){if(0===t)return k(n+1);o[t-1]++,o[t]=o[t-1]+1}return o[n-1]>e?k(n+1):o}function k(t=1){return Array.from(Array(t).keys())}const _=":".charCodeAt(0).toString(16).toUpperCase(),M=/[ !"#$%&'()\[\]{|}<>*+,./;=?@^`~\\]/;function L(t=""){var e,n;return null!==(n=null===(e=null===CSS||void 0===CSS?void 0:CSS.escape)||void 0===e?void 0:e.call(CSS,t))&&void 0!==n?n:function(t=""){return t.split("").map((t=>":"===t?`\\${_} `:M.test(t)?`\\${t}`:escape(t).replace(/%/g,"\\"))).join("")}(t)}const q={tag:D,id:function(t){return 0===t.length||t.length>1?[]:x(t[0])},class:function(t){return m(t.map(I))},attribute:function(t){return m(t.map(T))},nthchild:function(t){return m(t.map(j))},nthoftype:function(t){return m(t.map($))}},F={tag:A,id:x,class:I,attribute:T,nthchild:j,nthoftype:$};function V(t){return t.includes(e.tag)||t.includes(e.nthoftype)?[...t]:[...t,e.tag]}function Y(t={}){const n=[...w];return t[e.tag]&&t[e.nthoftype]&&n.splice(n.indexOf(e.tag),1),n.map((e=>{return(o=t)[n=e]?o[n].join(""):"";var n,o})).join("")}function B(t,e,n="",o){const r=function(t,e){return""===e?t:function(t,e){return[...t.map((t=>e+" "+t)),...t.map((t=>e+" > "+t))]}(t,e)}(function(t,e,n){const o=function(t,e){const{blacklist:n,whitelist:o,combineWithinSelector:r,maxCombinations:i}=e,c=h(n),u=h(o);return function(t){const{selectors:e,includeTag:n}=t,o=[].concat(e);return n&&!o.includes("tag")&&o.push("tag"),o}(e).reduce(((e,n)=>{const o=function(t,e){var n;return(null!==(n=q[e])&&void 0!==n?n:()=>[])(t)}(t,n),s=function(t=[],e,n){return t.filter((t=>n(t)||!e(t)))}(o,c,u),l=function(t=[],e){return t.sort(((t,n)=>{const o=e(t),r=e(n);return o&&!r?-1:!o&&r?1:0}))}(s,u);return e[n]=r?R(l,{maxResults:i}):l.map((t=>[t])),e}),{})}(t,n),r=function(t,e){return function(t){const{selectors:e,combineBetweenSelectors:n,includeTag:o,maxCandidates:r}=t,i=n?R(e,{maxResults:r}):e.map((t=>[t]));return o?i.map(V):i}(e).map((e=>function(t,e){const n={};return t.forEach((t=>{const o=e[t];o.length>0&&(n[t]=o)})),function(t={}){let e=[];return Object.entries(t).forEach((([t,n])=>{e=n.flatMap((n=>0===e.length?[{[t]:n}]:e.map((e=>Object.assign(Object.assign({},e),{[t]:n})))))})),e}(n).map(Y)}(e,t))).filter((t=>t.length>0))}(o,n),i=p(r);return[...new Set(i)]}(t,o.root,o),n);for(const e of r)if(g(t,e,o.root))return e;return null}function G(t){return{value:t,include:!1}}function W({selectors:t,operator:n}){let o=[...w];t[e.tag]&&t[e.nthoftype]&&(o=o.filter((t=>t!==e.tag)));let r="";return o.forEach((e=>{(t[e]||[]).forEach((({value:t,include:e})=>{e&&(r+=t)}))})),n.value+r}function H(n){return[":root",...y(n).reverse().map((n=>{const o=function(e,n,o=t.NONE){const r={};return n.forEach((t=>{Reflect.set(r,t,function(t,e){return F[e](t)}(e,t).map(G))})),{element:e,operator:N[o],selectors:r}}(n,[e.nthchild],t.DESCENDANT);return o.selectors.nthchild.forEach((t=>{t.include=!0})),o})).map(W)].join("")}function U(t,n={}){const o=function(t){const e=(Array.isArray(t)?t:[t]).filter(r);return[...new Set(e)]}(t),i=function(t,n={}){const o=Object.assign(Object.assign({},c),n);return{selectors:(r=o.selectors,Array.isArray(r)?r.filter((t=>{return n=e,o=t,Object.values(n).includes(o);var n,o})):[]),whitelist:l(o.whitelist),blacklist:l(o.blacklist),root:f(o.root,t),combineWithinSelector:!!o.combineWithinSelector,combineBetweenSelectors:!!o.combineBetweenSelectors,includeTag:!!o.includeTag,maxCombinations:d(o.maxCombinations),maxCandidates:d(o.maxCandidates)};var r}(o[0],n);let u="",s=i.root;function a(){return function(t,e,n="",o){if(0===t.length)return null;const r=[t.length>1?t:[],...b(t,e).map((t=>[t]))];for(const t of r){const e=B(t,0,n,o);if(e)return{foundElements:t,selector:e}}return null}(o,s,u,i)}let m=a();for(;m;){const{foundElements:t,selector:e}=m;if(g(o,e,i.root))return e;s=t[0],u=e,m=a()}return o.length>1?o.map((t=>U(t,i))).join(", "):function(t){return t.map(H).join(", ")}(o)}const z=U;return o})()));


    class NopechaSelector {
        constructor() {
            this.NAMESPACE = 'nopecha_selector';

            this.create_style(`
                #${this.NAMESPACE}_wrapper {
                    position: fixed;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background-color: transparent;
                    opacity: 0.4;
                    pointer-events: none;
                    z-index: 10000000;
                }
                .${this.NAMESPACE} {
                    position: absolute;
                }
                .${this.NAMESPACE}.margin {
                    background-color: rgba(230, 165, 18, 1);
                }
                .${this.NAMESPACE}.border {
                    background-color: rgba(255, 204, 128, 1);
                }
                .${this.NAMESPACE}.padding {
                    background-color: rgba(50, 255, 50, 1);
                }
                .${this.NAMESPACE}.content {
                    background-color: rgba(0, 153, 204, 1);
                }
                .${this.NAMESPACE}_label {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;

                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;

                    background-color: rgba(0, 0, 0, 1);
                    color: #fff;
                    font: normal 12px/12px Helvetica, sans-serif;
                    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
                    border-radius: 4px;
                    overflow: hidden;
                }
                .${this.NAMESPACE}_label > div {
                    padding: 4px 8px;
                }
                .${this.NAMESPACE}_label > div:first-child {
                    flex-grow: 1;
                }

                .${this.NAMESPACE}_mark {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;

                    width: 10px;
                    height: 10px;
                    background-color: #f44;
                    border-radius: 50%;
                    z-index: 2;
                }
            `);

            this.create_overlay();
            this.create_elements();

            this.update_timer;
        }

        create_style(css) {
            const $s = document.createElement('style');
            $s.type = 'text/css';
            if ($s.styleSheet) {
                $s.styleSheet.cssText = css;  // IE
            }
            else {
                $s.innerHTML = css;
            }
            document.getElementsByTagName('head')[0].appendChild($s);
        }

        create_overlay() {
            this.$wrapper = document.createElement('div');
            this.$wrapper.id = `${this.NAMESPACE}_wrapper`;
            document.body.append(this.$wrapper);
        }

        create_elements() {
            // this.remove_elements();

            this.$margin_box = document.createElement('div');
            this.$margin_box.classList.add(`${this.NAMESPACE}`);
            this.$margin_box.classList.add('margin');
            this.$wrapper.append(this.$margin_box);

            this.$border_box = document.createElement('div');
            this.$border_box.classList.add(`${this.NAMESPACE}`);
            this.$border_box.classList.add('border');
            this.$wrapper.append(this.$border_box);

            this.$padding_box = document.createElement('div');
            this.$padding_box.classList.add(`${this.NAMESPACE}`);
            this.$padding_box.classList.add('padding');
            this.$wrapper.append(this.$padding_box);

            this.$content_box = document.createElement('div');
            this.$content_box.classList.add(`${this.NAMESPACE}`);
            this.$content_box.classList.add('content');
            this.$wrapper.append(this.$content_box);

            this.$label = document.createElement('div');
            this.$label.classList.add(`${this.NAMESPACE}_label`);
            this.$wrapper.append(this.$label);

            this.$mark = document.createElement('div');
            this.$mark.classList.add(`${this.NAMESPACE}_mark`);
            this.$wrapper.append(this.$mark);
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

        terminate() {
            document.querySelector(`#${this.NAMESPACE}_wrapper`).remove();
        }

        clear() {
            this.$label.innerHTML = '';
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

            this.$mark.style.top = '0px';
            this.$mark.style.left = '0px';
        }

        update($t, delay=0) {
            const self = this;
            if ($t) {
                self.$t = $t;
            }
            if (!self.$t) {
                return;
            }

            clearTimeout(self.update_timer);
            self.update_timer = setTimeout(function () {
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

                const dimensions = `[${box.width.toFixed(0)}, ${box.height.toFixed(0)}]`;
                const node_str = self.get_css(self.$t);
                self.$label.innerHTML = `
                    <div>${node_str}</div>
                    <div>${dimensions}</div>
                `;

                const center = self.get_center($t);
                self.$mark.style.top = `${center.y-5}px`;
                self.$mark.style.left = `${center.x-5}px`;
            }, delay);
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
    }

    let nopecha_selector = null;
    let $last = null;
    let autodetect = null;  // Settings key for selector (ocr_image_selector / ocr_input_selector)

    function on_click(event) {
        const $e = event.target;
        const selector = nopecha_selector.get_css($e);
        console.log('selector', selector);
        stop();

        BG.exec('set_settings', {id: autodetect, value: selector});
    }

    function on_mousemove(event) {
        const $e = event.target;
        if ($e === $last) {
            return;
        }
        $last = $e;
        nopecha_selector.update($e);
    }

    function on_mousewheel(event) {
        nopecha_selector.update();
    }

    function start() {
        nopecha_selector = new NopechaSelector();
        document.body.addEventListener('click', on_click);
        document.body.addEventListener('mousemove', on_mousemove);
        document.body.addEventListener('mousewheel', on_mousewheel);
    }

    function stop() {
        document.body.removeEventListener('click', on_click);
        document.body.removeEventListener('mousemove', on_mousemove);
        document.body.removeEventListener('mousewheel', on_mousewheel);
        nopecha_selector.terminate();
    }

    chrome.runtime.onMessage.addListener((req, sender, send) => {
        console.log('message', req, sender, send);
        if (req.autodetect) {
            autodetect = req.autodetect;
            start();
        }
    });
})();
