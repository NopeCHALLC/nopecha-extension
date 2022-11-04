(async () => {
    while (true) {
        await Time.sleep(1000);

        const settings = await BG.exec('get_settings');
        if (!settings || !settings.enabled || !settings.turnstile_auto_solve) {
            continue;
        }

        document.querySelector('#not_a_bot')?.click();
    }
})();
