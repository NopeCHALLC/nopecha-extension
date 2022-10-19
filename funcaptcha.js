(async () => {

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
        // console.log('clicked', index, task);
        if (task && image) {
            const data = {task, image, index};
            // console.log('sending', data);
            await Net.fetch('https://api.nopecha.com/upload', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data),
            });
        }
    }


    while (true) {
        await sleep(1000);

        const $verify = document.querySelector('#home_children_button');
        if ($verify) {
            $verify.click();
        }

        const $btns = document.querySelectorAll('#game_children_challenge ul > li > a');
        for (const i in $btns) {
            const $e = $btns[i];
            $e.removeEventListener('click', on_click.bind(this, parseInt(i)));
            $e.addEventListener('click', on_click.bind(this, parseInt(i)));
        }
    }
})();
