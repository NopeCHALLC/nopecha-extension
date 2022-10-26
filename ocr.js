(async () => {
    function is_present(settings) {
        try {
            return document.querySelector(settings.ocr_image_selector) !== null && document.querySelector(settings.ocr_input_selector) !== null;
        } catch (e) {}
        return false;
    }


    // function get_image_url($e) {
    //     // Div with css background (e.g. hcaptcha)
    //     const matches = $e?.style['background']?.trim()?.match(/(?!^)".*?"/g);
    //     if (matches?.length > 0) {
    //         return matches[0].replaceAll('"', '');
    //     }

    //     // Img with src or data-src
    //     let url = $e.src || $e.dataset.src;
    //     if (url) {
    //         if (url.startsWith('/')) {
    //             url = `${window.location.origin}${url}`;
    //         }
    //         return url;
    //     }

    //     return null;
    // }


    async function get_image_data(selector) {
        function get_image_from_style($e) {
            return new Promise(resolve => {
                let bg = $e.style.backgroundImage;
                if (bg) {
                    const matches = bg.trim().match(/(?!^)".*?"/g);
                    if (!matches || matches.length === 0) {
                        bg = null;
                    }
                    bg = matches[0].replaceAll('"', '');
                }
                const $img = new Image();
                $img.onload = () => resolve($img);
                $img.src = bg;
            });
        }

        async function get_canvas(selector) {
            const $e = document.querySelector(selector);

            // Canvas
            if ($e instanceof HTMLCanvasElement) {
                return $e;
            }

            let $img;
            if ($e instanceof HTMLImageElement) {
                $img = $e;
            }
            else {
                $img = await get_image_from_style($e);
            }

            if (!$img) {
                throw Error(`failed to get image element for ${selector}`);
            }

            const $canvas = document.createElement('canvas');
            $canvas.width = $img.width;
            $canvas.height = $img.height;
            const ctx = $canvas.getContext('2d');
            ctx.drawImage($img, 0, 0);

            return $canvas;
        }

        const $canvas = await get_canvas(selector);
        return $canvas.toDataURL('image/jpeg').split(';base64,')[1];
    }


    let last_image_data = null;
    function on_task_ready(settings, i=100) {
        return new Promise(resolve => {
            let checking = false;
            const check_interval = setInterval(async () => {
                if (checking) {
                    return;
                }
                checking = true;

                // const $image = document.querySelector(settings.ocr_image_selector);
                // const image_url = get_image_url($image);
                // if (!image_url || image_url === '') {
                //     console.log('no image url', $image);
                //     checking = false;
                //     return;
                // }

                // const url_hash = JSON.stringify(image_url);
                // if (last_image_data === url_hash) {
                //     console.log('task unchanged');
                //     checking = false;
                //     return;
                // }
                // last_image_data = url_hash;

                const image_data = await get_image_data(settings.ocr_image_selector);
                if (!image_data) {
                    // console.log('no image data');
                    checking = false;
                    return;
                }

                if (last_image_data === image_data) {
                    // console.log('image_data unchanged');
                    checking = false;
                    return;
                }
                last_image_data = image_data;

                clearInterval(check_interval);
                checking = false;
                return resolve({image_data});
            }, i);
        });
    }


    async function on_present(settings) {
        const {image_data} = await on_task_ready(settings);

        // Detect images
        const {job_id, data} = await NopeCHA.post({
            captcha_type: IS_DEVELOPMENT ? 'ocr_dev' : 'ocr',
            image_data: [image_data],
            key: settings.key,
        });
        if (!data) {
            return;
        }

        // Fill input
        if (data && data.length > 0) {
            const $input = document.querySelector(settings.ocr_input_selector);
            if ($input && !$input.value) {
                $input.value = data[0];
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
