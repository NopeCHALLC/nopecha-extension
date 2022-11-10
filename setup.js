(async () => {
    function print_html() {
        function wrap(text) {
            return `<p style='font-family: monospace; font-size: 12px; white-space: pre;'>${text}</p>`
        }

        const s = [];
        for (const e of arguments) {
            s.push(wrap(e));
        }
        s.push(wrap('Join us on <a href="https://nopecha.com/discord" target="_blank">Discord</a>'));
        document.body.innerHTML = s.join('<hr>');
    }

    try {
        if (document.location.hash) {
            print_html('Importing settings...');

            const settings = SettingsManager.import(document.location.hash);
            console.log('imported settings', settings);

            const proms = [];
            for (const [k, v] of Object.entries(settings)) {
                console.log(k, v);
                proms.push(BG.exec('set_settings', {id: k, value: v}));
            }
            await Promise.all(proms);

            const url = window.location.href;
            print_html(
                `Visiting this URL will import your NopeCHA settings.\n<a href="${url}">${url}</a>`,
                `Successfully imported settings.\n${JSON.stringify(settings, null, 4)}`);
        }
        else {
            print_html(
                'Invalid URL.\nPlease set the URL hash and reload the page.',
                'Example: https://nopecha.com/setup#TESTKEY123');
        }
    } catch (e) {
        console.error(e);
        print_html('Failed to import settings.\nPlease verify that your URL is formed properly.');
    }
})();
