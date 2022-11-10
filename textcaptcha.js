(async () => {
    function is_present(settings) {
        try {
            const $image = document.querySelector(settings.textcaptcha_image_selector);
            if (!$image) {
                return false;
            }
            const $input = document.querySelector(settings.textcaptcha_input_selector);
            if (!$input || $input.value) {
                return false;
            }

            return true;
        } catch (e) {}
        return false;
    }


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
            $canvas.width = $img.naturalWidth;
            $canvas.height = $img.naturalHeight;
            const ctx = $canvas.getContext('2d');
            ctx.drawImage($img, 0, 0);

            return $canvas;
        }

        try {
            const $canvas = await get_canvas(selector);
            return $canvas.toDataURL('image/jpeg').split(';base64,')[1];
        } catch (e) {
            return null;
        }
    }


    let last_image_data = null;
    function on_task_ready(i=100) {
        return new Promise(resolve => {
            let checking = false;
            const check_interval = setInterval(async () => {
                if (checking) {
                    return;
                }
                checking = true;

                const settings = await BG.exec('get_settings');
                if (!settings.textcaptcha_auto_solve) {
                    checking = false;
                    return;
                }

                const image_data = await get_image_data(settings.textcaptcha_image_selector);
                if (!image_data) {
                    checking = false;
                    return;
                }

                if (last_image_data === image_data) {
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


    async function on_present() {
        const {image_data} = await on_task_ready();

        const settings = await BG.exec('get_settings');
        if (!settings.enabled || !settings.textcaptcha_auto_solve) {
            return;
        }

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
            const $input = document.querySelector(settings.textcaptcha_input_selector);
            if ($input && !$input.value) {
                $input.value = data[0];
            }
        }
    }


    while (true) {
        await Time.sleep(1000);

        const settings = await BG.exec('get_settings');
        if (!settings || !settings.enabled) {
            continue;
        }

        if (settings.textcaptcha_auto_solve && is_present(settings)) {
            await on_present();
        }
    }
})();
