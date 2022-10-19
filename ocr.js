(async () => {


    function is_present(settings) {
        return document.querySelector(settings.ocr_image_selector) !== null && document.querySelector(settings.ocr_input_selector) !== null;
    }


    function get_image_url($e) {
        // Div with css background (e.g. hcaptcha)
        const matches = $e?.style['background']?.trim()?.match(/(?!^)".*?"/g);
        if (matches?.length > 0) {
            return matches[0].replaceAll('"', '');
        }

        // Img with src or data-src
        let url = $e.src || $e.dataset.src;
        if (url) {
            if (url.startsWith('/')) {
                url = `${window.location.origin}${url}`;
            }
            return url;
        }

        return null;
    }


    let last_url_hash = null;
    function on_task_ready(settings, i=100) {
        return new Promise(resolve => {
            let checking = false;
            const check_interval = setInterval(async () => {
                if (checking) {
                    return;
                }
                checking = true;

                const $image = document.querySelector(settings.ocr_image_selector);
                const image_url = get_image_url($image);
                if (!image_url || image_url === '') {
                    console.log('no image url', $image);
                    checking = false;
                    return;
                }

                const url_hash = JSON.stringify(image_url);
                if (last_url_hash === url_hash) {
                    console.log('task unchanged');
                    checking = false;
                    return;
                }
                last_url_hash = url_hash;

                clearInterval(check_interval);
                checking = false;
                return resolve({image_url});
            }, i);
        });
    }


    async function on_present(settings) {
        const {image_url} = await on_task_ready(settings);

        const solve_start = Time.time();

        // Detect images
        const {job_id, results} = await NopeCHA.post({
            captcha_type: 'ocr',
            image_urls: [image_url],
            key: settings.key,
        });
        if (!results) {
            return;
        }

        // Fill input
        if (results && results.length > 0) {
            const $input = document.querySelector(settings.ocr_input_selector);
            if ($input && !$input.value) {
                $input.value = results[0];
            }
        }
    }


    // Example site
    // https://www.projecthoneypot.org/contact_us.php
    // settings.ocr_image_selector = 'img.captchapict';
    // settings.ocr_input_selector = 'input.captcha';


    while (true) {
        await Time.sleep(1000);

        const settings = await BG.exec('get_settings');
        if (!settings) {
            continue;
        }

        if (settings.ocr_auto_solve && is_present(settings)) {
            await on_present(settings);
        }
    }
})();
