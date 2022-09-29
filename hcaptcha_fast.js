/**
 * Sets the hCaptcha language to English.
 */

setTimeout(() => {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('language.js');
    s.onload = () => {
        s.remove();
    };
    (document.head || document.documentElement).appendChild(s);
}, 0);


/**
 * Enables drag select for hCaptcha.
 */

(async () => {
    const {Time} = await import(chrome.runtime.getURL('utils.js'));


    let $start = null;
    let is_mousedown = false;
    let is_selecting = false;
    function toggle_img($e, enabled, include_start=false) {
        if (!$e) {
            return;
        }

        if (!include_start && $start === $e) {
            return;
        }

        if (enabled === true && $e.getAttribute('aria-pressed') === 'false') {
            $e.click();
        }
        else if (enabled === false && $e.getAttribute('aria-pressed') === 'true') {
            $e.click();
        }
    }
    document.addEventListener('mousedown', e => {
        if (e?.target?.parentNode?.getAttribute('aria-pressed') === 'false') {
            is_mousedown = true;
            is_selecting = true;
        }
        else if (e?.target?.parentNode?.getAttribute('aria-pressed') === 'true') {
            is_mousedown = true;
            is_selecting = false;
        }
        $start = e?.target?.parentNode;
    });
    document.addEventListener('mouseup', e => {
        is_mousedown = false;
        $start = null;
    });
    document.addEventListener('mousemove', e => {
        if (is_mousedown) {
            if ($start !== e?.target?.parentNode && $start !== null) {
                toggle_img($start, is_selecting, true);
            }
            toggle_img(e?.target?.parentNode, is_selecting);
        }
    });
})();
