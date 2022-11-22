(async () => {
    const RELOAD_ON_SOLVED = IS_DEVELOPMENT;  // If true, restart captcha to scrape more data
    const SUBMISSION_STRATEGY = 'lazy';
    window.nopecha = [];  // Lazy cache
    const listeners = {};  // Click listeners


    function get_task() {
        const $task = document.querySelector('#game_children_text > h2') || document.querySelector('#game-header');
        return $task?.innerText?.trim();
    }


    function get_image() {
        const $image = document.querySelector('img#game_challengeItem_image') || document.querySelector('#challenge-image');
        return $image?.src?.split(';base64,')[1];
    }


    async function on_click(index) {
        const task = get_task();
        const image = get_image();
        if (task && image) {
            const url = (await BG.exec('Tab.info'))?.url;
            const data = {task, image, index, url};

            if (SUBMISSION_STRATEGY.startsWith('l')) {
                window.parent.postMessage({nopecha: true, action: 'append', data: data}, '*');
            }
            if (SUBMISSION_STRATEGY.startsWith('e')) {
                await Net.fetch('https://api.nopecha.com/upload', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data),
                });
            }
        }
    }


    const event_method = window.addEventListener ? 'addEventListener' : 'attachEvent';
    const message_event = event_method == 'attachEvent' ? 'onmessage' : 'message';
    window[event_method](message_event, async e => {
        const key = e.message ? 'message' : 'data';
        const data = e[key];
        if (data && data.nopecha === true) {
            if (data.action === 'append') {
                window.nopecha.push(data.data);
            }
            else if (data.action === 'clear') {
                window.nopecha = [];
            }
            else if (data.action === 'reload') {
                window.parent.postMessage({nopecha: true, action: 'reload'}, '*');
                window.location.reload(true);
            }
        }
    }, false);


    while (true) {
        await Time.sleep(1000);

        try {
            const $success = document.querySelector('body.victory');
            if ($success) {
                const proms = [];
                for (const data of window.nopecha) {
                    const prom = Net.fetch('https://api.nopecha.com/upload', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(data),
                    });
                    proms.push(prom);
                }
                await Promise.all(proms);
                window.nopecha = [];

                if (RELOAD_ON_SOLVED) {
                    window.parent.postMessage({nopecha: true, action: 'reload'}, '*');
                    window.location.reload(true);
                }
            }

            const $timeout = document.querySelector('#timeout_widget');
            if ($timeout?.style?.display === 'block') {
                window.parent.postMessage({nopecha: true, action: 'reload'}, '*');
                window.location.reload(true);
            }

            const $btns = document.querySelectorAll('#game_children_challenge ul > li > a');
            for (const i in $btns) {
                const $e = $btns[i];
                if (i in listeners) {
                    $e.removeEventListener('click', listeners[i]);
                }
                listeners[i] = on_click.bind(this, parseInt(i));
                $e.addEventListener('click', listeners[i]);
            }
        } catch (e) {}
    }
})();
