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
        return $image?.src;
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

        try {
            // const $verify = document.querySelector('#home_children_button');
            const $verify = document.querySelector('button[aria-describedby="descriptionVerify"]');
            if ($verify) {
                // console.log('$verify', $verify);
                $verify.click();
            }

            // const $success = document.querySelector('#victoryImage');
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

            const $fail_incorrect = document.querySelector('#wrong_children_button');
            if ($fail_incorrect) {
                console.log('$fail_incorrect', $fail_incorrect);
                await BG.exec('empty_cache', {name: 'funcaptcha', tab_specific: false});
                $fail_incorrect.click();
            }

            const $fail_timeout = document.querySelector('#wrongTimeout_children_button');
            if ($fail_timeout) {
                console.log('$fail_timeout', $fail_timeout);
                $fail_timeout.click();
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
