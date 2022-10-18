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
        return $image?.src?.replace('data:image/jpeg;base64,', '');
    }


    async function on_click(index) {
        const task = get_task();
        const image = get_image();
        console.log('clicked', index);
        if (task && image) {
            const data = {task, image, index};
            await BG.exec('append_cache', {name: 'funcaptcha', value: data, tab_specific: false});
        }
    }


    let listeners = {};
    while (true) {
        await sleep(1000);

        const settings = await BG.exec('get_settings');
        if (!settings || settings.funcaptcha_auto_solve) {
            continue;
        }

        try {
            const $success = document.querySelector('body.victory');
            if ($success) {
                console.log('$success', $success);

                const answers = await BG.exec('get_cache', {name: 'funcaptcha', tab_specific: false});
                console.log('answers.length', answers.length);
                const proms = [];
                for (const data of answers) {
                    console.log('submitting', data);
                    const prom = Net.fetch('https://api.nopecha.com/upload', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(data),
                    });
                    proms.push(prom);
                }
                await Promise.all(proms);
                await BG.exec('empty_cache', {name: 'funcaptcha', tab_specific: false});
                window.location.reload();
            }

            // const $timeout = document.querySelector('#timeout_widget');
            // if ($timeout?.style?.display === 'block') {
            //     console.log('$timeout', $timeout);
            //     await sleep(3000);
            //     window.location.reload();
            // }

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
