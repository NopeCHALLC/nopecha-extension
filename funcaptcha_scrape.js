(async () => {
    class BG {
        static exec(method, data) {
            return new Promise(resolve => {
                try {
                    chrome.runtime.sendMessage({method, data}, resolve);
                } catch (e) {
                    console.log('exec failed', e);
                    resolve();
                }
            });
        }
    }


    class Net {
        static async fetch(url, options) {
            return await BG.exec('fetch', {url, options});
        }
    }


    function sleep(t) {
        return new Promise(resolve => setTimeout(resolve, t));
    }


    function get_task() {
        const $task = document.querySelector('#game_children_text > h2');
        return $task?.innerText;
    }


    function get_image() {
        const $image = document.querySelector('img#game_challengeItem_image');
        return $image?.src?.split(';base64,')[1];
    }


    async function on_click(index) {
        const task = get_task();
        const image = get_image();
        console.log('clicked', index);
        if (task && image) {
            const data = {task, image, index};
            // window.parent.postMessage({nopecha: true, action: 'append', data: data}, '*');

            // await Net.fetch('https://api.nopecha.com/upload', {
            //     method: 'POST',
            //     headers: {'Content-Type': 'application/json'},
            //     body: JSON.stringify(data),
            // });
        }
    }

    window.nopecha = [];
    const eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
    const eventer = window[eventMethod];
    const messageEvent = eventMethod == 'attachEvent' ? 'onmessage' : 'message';
    eventer(messageEvent, async e => {
        const key = e.message ? 'message' : 'data';
        const data = e[key];
        if (data && data.nopecha === true) {
            // console.log('message', key, data);
            if (data.action === 'append') {
                console.log('append', data);
                window.nopecha.push(data.data);
            }
            else if (data.action === 'clear') {
                console.log('clear');
                window.nopecha = [];
            }
            else if (data.action === 'reload') {
                console.log('reload');
                window.parent.postMessage({nopecha: true, action: 'reload'}, '*');
                window.location.reload(true);
            }
        }
    },false);


    let listeners = {};
    while (true) {
        await sleep(500);

        const settings = await BG.exec('get_settings');
        // if (!settings || settings.funcaptcha_auto_solve) {
        if (!settings) {
            continue;
        }

        try {
            const $success = document.querySelector('body.victory');
            if ($success) {
                console.log('$success', $success);
                // const nopecha = document.querySelector('#CaptchaFrame').contentWindow.nopecha || [];
                // console.log('nopecha.length', nopecha.length);
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
        } catch (e) {
            // console.log('error', e);
        }
    }
})();
