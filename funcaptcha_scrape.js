(async () => {
    const SCRAPE_ROBLOX = false;  // If true, SUBMISSION_STRATEGY should be 'eager' to allow scraping
    const SUBMISSION_STRATEGY = 'lazy';  // One of: eager, lazy, or none
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


    async function reload_if_roblox() {
        // Scrape roblox by reopening modal before verification
        if (SCRAPE_ROBLOX) {
            await Time.sleep(5000);
            window.parent.postMessage({nopecha: true, action: 'reload'}, '*');
            // window.location.reload(true);
        }
    }


    async function on_click(index) {
        // console.log('clicked', index);
        const task = get_task();
        const image = get_image();
        if (task && image) {
            // Ignore learned tasks
            if (task.replace('Pick the ', '').split(' ').length <= 2) {
                return await reload_if_roblox();
            }
            if (task === 'Pick one square that shows two identical objects.') {
                return await reload_if_roblox();
            }
            if (task === 'Pick the image that is the correct way up') {
                return await reload_if_roblox();
            }
            if (task === "Pick the mouse that can't reach the cheese") {
                return await reload_if_roblox();
            }
            // if (task.startsWith('Pick the dice pair whose top sides add up to ')) {
            //     return await reload_if_roblox();
            // }

            const data = {task, image, index};
            console.log('submission', SUBMISSION_STRATEGY, data);

            if (SUBMISSION_STRATEGY === 'lazy') {
                // Lazy submission
                window.parent.postMessage({nopecha: true, action: 'append', data: data}, '*');
            }
            if (SUBMISSION_STRATEGY === 'eager') {
                // Eager submission
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
            // console.log('message', key, data);
            if (data.action === 'append') {
                // console.log('append', data, window.location.href);
                window.nopecha.push(data.data);

                // Scrape roblox
                if (SCRAPE_ROBLOX && window.location.host === 'roblox-api.arkoselabs.com') {
                    document.querySelector('.fc_meta_reload_btn')?.click();
                }
            }
            else if (data.action === 'clear') {
                // console.log('clear');
                window.nopecha = [];
            }
            else if (data.action === 'reload') {
                // console.log('reload');
                if (SCRAPE_ROBLOX && window.location.host === 'www.roblox.com') {
                    document.querySelector('.challenge-captcha-close-button')?.click();
                    document.querySelector('#signup-button')?.click();
                }
                else {
                    // document.querySelector('.fc_meta_reload_btn')?.click();
                    window.parent.postMessage({nopecha: true, action: 'reload'}, '*');
                    window.location.reload(true);
                }
            }
        }
    }, false);


    while (true) {
        await Time.sleep(1000);

        try {
            const $success = document.querySelector('body.victory');
            if ($success) {
                console.log('$success', $success);
                const proms = [];
                for (const data of window.nopecha) {
                    console.log('submitting', data);
                    const prom = Net.fetch('https://api.nopecha.com/upload', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(data),
                    });
                    proms.push(prom);
                }
                await Promise.all(proms);
                window.nopecha = [];
                window.parent.postMessage({nopecha: true, action: 'reload'}, '*');
                window.location.reload(true);
            }

            const $timeout = document.querySelector('#timeout_widget');
            if ($timeout?.style?.display === 'block') {
                console.log('$timeout', $timeout);
                window.parent.postMessage({nopecha: true, action: 'reload'}, '*');
                window.location.reload(true);
            }

            const $btns = document.querySelectorAll('#game_children_challenge ul > li > a');
            // console.log('$btns', $btns);
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
