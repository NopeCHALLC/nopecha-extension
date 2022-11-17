/**
 * Enables drag select for ReCAPTCHA and faster animations.
 */

(async () => {
    let $start = null;
    let is_mousedown = false;
    let is_selecting = false;
    function get_parent($e) {
        let $node = $e;
        while ($node && !$node.classList?.contains('rc-imageselect-tile')) {
            $node = $node.parentNode;
        }
        return $node;
    }
    function toggle_img($e, enabled, include_start=false) {
        if (!$e) {
            return;
        }

        if (!include_start && $start === $e) {
            return;
        }

        if (enabled === true && $e.classList.contains('rc-imageselect-tileselected')) {
            $e.click();
        }
        else if (enabled === false && !$e.classList.contains('rc-imageselect-tileselected')) {
            $e.click();
        }
    }
    document.addEventListener('mousedown', e => {
        const $e = get_parent(e?.target);
        if (!$e) {
            return;
        }
        if ($e.classList.contains('rc-imageselect-tileselected')) {
            is_mousedown = true;
            is_selecting = true;
        }
        else {
            is_mousedown = true;
            is_selecting = false;
        }
        $start = $e;
    });
    document.addEventListener('mouseup', e => {
        is_mousedown = false;
        $start = null;
    });
    document.addEventListener('mousemove', e => {
        const $e = get_parent(e?.target);
        if (is_mousedown) {
            if ($start !== $e && $start !== null) {
                toggle_img($start, is_selecting, true);
            }
            toggle_img($e, is_selecting);
        }
    });

    const SPEED = 2;

    window.addEventListener('load', () => {
        const sheet = document.body.appendChild(document.createElement('style')).sheet;
        sheet.insertRule(`.rc-imageselect-table-33, .rc-imageselect-table-42, .rc-imageselect-table-44 {transition-duration: ${1/SPEED}s !important}`, 0);
        sheet.insertRule(`.rc-imageselect-tile {transition-duration: ${4/SPEED}s !important}`, 1);
        sheet.insertRule(`.rc-imageselect-dynamic-selected {transition-duration: ${2/SPEED}s !important}`, 2);
        sheet.insertRule(`.rc-imageselect-progress {transition-duration: ${1/SPEED}s !important}`, 3);
        sheet.insertRule(`.rc-image-tile-overlay {transition-duration: ${1/SPEED}s !important}`, 4);
        sheet.insertRule(`#rc-imageselect img {pointer-events: none !important}`, 5);
    });
})();
