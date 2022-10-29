let plan = null;
let checking_server_plan = false;
let rendering_server_plan = false;


async function check_plan() {
    const settings = await BG.exec('get_settings');
    if (!settings) {
        return;
    }

    if (checking_server_plan) {
        return;
    }
    checking_server_plan = true;

    plan = await BG.exec('get_server_plan', {key: settings.key});  // plan = {plan, credit, quota, duration, lastreset}

    if (plan.error) {
        plan = {
            error: true,
            plan: plan.message,
            credit: 0,
            quota: 0,
            duration: null,
            lastreset: null,
        };
    }

    checking_server_plan = false;

    const $loading_overlay = document.querySelector('#loading_overlay');
    $loading_overlay.classList.add('hidden');
}


async function initialize_ui() {
    const settings = await BG.exec('get_settings');

    async function set_active_tab(id) {
        // Deactivate all tab buttons
        for (const $tab_btn of document.querySelectorAll('.tab_btn')) {
            $tab_btn.classList.remove('active');
        }
        // Hide all tabs
        for (const $tab of document.querySelectorAll('.tab')) {
            $tab.classList.add('hidden');
        }
        // Activate selected tab button
        document.querySelector(`.tab_btn[data-target="${id}"]`).classList.add('active');
        // Show selected tab
        document.querySelector(id).classList.remove('hidden');

        await BG.exec('set_settings', {id: 'active_tab', value: id});
    }

    async function set_switch(id, enabled) {
        const $switch = document.querySelector(`input#${id}[type="checkbox"]`);
        if (!$switch) {
            return;
        }

        const disables = $switch.dataset?.disables?.split(',');
        if (disables) {
            for (const disable_id of disables) {
                const $e = document.querySelector(`#${disable_id}`);
                if (enabled) {
                    $e.disabled = false;
                }
                else {
                    $e.disabled = true;
                }
            }
        }

        $switch.checked = enabled;
        await BG.exec('set_settings', {id: id, value: enabled});
    }

    async function set_field(id, value) {
        const $field = document.querySelector(`input#${id}[type="text"]`);
        if (!$field) {
            return;
        }

        try {
            value = value.trim();
        } catch {}

        if ($field.classList.contains('number')) {
            try {
                value = parseInt(value);
            } catch {
                value = 0;
            }

            if (isNaN(value)) {
                value = 0;
            }
            if (value < 0) {
                value = 0;
            }
            if (value > 999999) {
                value = 999999;
            }
        }

        $field.value = value;
        await BG.exec('set_settings', {id: id, value: value});
    }

    async function set_select(id, value) {
        const $select = document.querySelector(`select#${id}`);
        if (!$select) {
            return;
        }

        $select.value = value;
        await BG.exec('set_settings', {id: id, value: value});
    }

    /**
     * Initialize GUI elements from settings
     */

    // Active tab
    await set_active_tab(settings.active_tab);

    // Inputs
    for (const k in settings) {
        try {
            await set_switch(k, settings[k]);
            await set_field(k, settings[k]);
            await set_select(k, settings[k]);
        } catch {}
    }

    /**
     * Listeners for GUI elements which sets settings
     */

    // Subscription key changed
    let change_delay_timer = null;
    document.querySelector('#key').addEventListener('input', () => {
        clearTimeout(change_delay_timer);
        change_delay_timer = setTimeout(check_plan, 500);
    });

    // Tab switching
    for (const $e of document.querySelectorAll('.tab_btn')) {
        const target = $e.dataset.target;
        $e.addEventListener('click', async () => set_active_tab(target));
    }

    // Toggles
    for (const $e of document.querySelectorAll('.settings_group input[type="checkbox"]')) {
        $e.addEventListener('change', () => set_switch($e.id, $e.checked));
    }

    // Texts
    for (const $e of document.querySelectorAll('.settings_group input[type="text"]')) {
        $e.addEventListener('input', () => set_field($e.id, $e.value));
    }

    // Dropdowns
    for (const $e of document.querySelectorAll('.settings_group select')) {
        $e.addEventListener('change', () => set_select($e.id, $e.value));
    }

    // Autodetect
    for (const $e of document.querySelectorAll('.autodetect')) {
        $e.addEventListener('click', async () => {
            const key = $e.dataset.key;
            await BG.exec('relay', {autodetect: key});
            window.close();
        });
    }
}


async function render_plan() {
    const settings = await BG.exec('get_settings');
    if (!settings) {
        return;
    }
    if (!plan) {
        return;
    }
    if (rendering_server_plan) {
        return;
    }
    rendering_server_plan = true;

    const $plan = document.querySelector('#plan');
    const $credit = document.querySelector('#credit');
    const $refills = document.querySelector('#refills');
    const $ipbanned_warning = document.querySelector('#ipbanned_warning');

    const now = Date.now() / 1000;
    let secs_until_reset = null;
    if (plan.lastreset && plan.duration) {
        secs_until_reset = Math.floor(Math.max(0, plan.duration - (now - plan.lastreset)));
    }

    // Display plan name
    let plan_name = plan.plan;
    if (plan_name !== 'Invalid key') {
        plan_name = `${plan_name} Plan`
    }
    $plan.innerHTML = plan_name;


    if (plan.error) {
        $plan.classList.add('red');
    }
    else {
        $plan.classList.remove('red');
    }

    if (plan.plan === 'Banned IP') {
        $ipbanned_warning.classList.remove('hidden');
    }
    else {
        $ipbanned_warning.classList.add('hidden');
    }

    // Display remaining credits
    if (secs_until_reset === 0) {
        // Show loading icon for remaining credit while the server resets quota
        $credit.classList.remove('red');
        $credit.innerHTML = '<div class="loading"><div></div><div></div><div></div><div></div></div>';
    }
    else {
        $credit.innerHTML = `${plan.credit} / ${plan.quota}`;
        if (plan.credit === 0) {
            $credit.classList.add('red');
        }
        else {
            $credit.classList.remove('red');
        }
    }

    // Display time until reset
    if (secs_until_reset) {
        const hms = Time.seconds_as_hms(secs_until_reset);
        $refills.innerHTML = `${hms}`;
    }
    else {
        $refills.innerHTML = '<div class="loading"><div></div><div></div><div></div><div></div></div>';
    }

    // Plan may have been reset. Fetch data from server
    if (plan.duration !== 0 && secs_until_reset === 0) {
        await check_plan();
    }

    rendering_server_plan = false;
}


async function init_ui() {
    const settings = await BG.exec('get_settings');

    /**
     * Power button
     */

    const $power_wrapper = document.querySelector('#power');
    const $power_spinning = $power_wrapper.querySelector('.spinning');
    const $power_static = $power_wrapper.querySelector('.static');
    const $power_btn = $power_wrapper.querySelector('.btn');
    if (settings.enabled) {
        $power_static.classList.remove('hidden');
        $power_btn.classList.remove('off');
    }
    else {
        $power_btn.classList.add('off');
    }
    let last_anim = null;
    $power_wrapper.addEventListener('click', async () => {
        clearTimeout(last_anim);
        $power_spinning.classList.add('hidden');
        $power_static.classList.add('hidden');

        if ($power_btn.classList.contains('off')) {
            $power_btn.classList.remove('off');
            $power_spinning.classList.remove('hidden');
            await BG.exec('set_settings', {id: 'enabled', value: true});
            await BG.exec('set_icon', 'on');
            // await BG.exec('set_badge', {global: true, text: 'ON', color: '#00FF00'});
            last_anim = setTimeout(() => {
                $power_spinning.classList.add('hidden');
                $power_static.classList.remove('hidden');
            }, 1000);
        }
        else {
            await BG.exec('set_settings', {id: 'enabled', value: false});
            await BG.exec('set_icon', 'off');
            // await BG.exec('set_badge', {global: true, text: 'OFF', color: '#FF0000'});
            $power_btn.classList.add('off');
        }
    });

    /**
     * Subscription key
     */

    const $key = document.querySelector('.settings_text[data-settings="key"]');
    function toggle_edit_key() {
        if ($key.classList.contains('hiddenleft')) {
            $key.classList.remove('hiddenleft');
            $key.focus();
        }
        else {
            $key.classList.add('hiddenleft');
        }
    }
    document.querySelector('#edit_key').addEventListener('click', toggle_edit_key);
    $key.addEventListener('keydown', e => {
        e = e || window.event;
        if (e.key === 'Enter') {
            toggle_edit_key();
            check_plan();
        }
    });

    // let change_delay_timer = null;
    // document.querySelector('#key').addEventListener('input', () => {
    //     clearTimeout(change_delay_timer);
    //     change_delay_timer = setTimeout(check_plan, 500);
    // });

    /**
     * Tab switching
     */

    for (const $e of document.querySelectorAll('[data-tabtarget]:not([data-tabtarget=""])')) {
        $e.addEventListener('click', () => {
            for (const $t of document.querySelectorAll('.tab')) {
                $t.classList.add('hidden');
            }
            const $tab = document.querySelector(`[data-tab="${$e.dataset.tabtarget}"]`);
            $tab.classList.remove('hidden');
        });
    }

    /**
     * Navigate backwards on mouse back or backspace
     */

    function back() {
        const $active_tab = document.querySelector('.tab:not(.hidden)');
        $active_tab.querySelector('.back')?.click();
    }
    document.addEventListener('mousedown', e => {
        e = e || window.event;
        if ((e.buttons & 8) > 0) {
            back();
        }
    });
    document.addEventListener('keydown', e => {
        e = e || window.event;
        if (e.key === 'Backspace' && !(e.target instanceof HTMLInputElement)) {
            back();
        }
    });

    /**
     * Set UI from settings and attach listeners
     */

    for (const [k, v] of Object.entries(settings)) {
        const $toggles = document.querySelectorAll(`.settings_toggle[data-settings="${k}"]`);
        for (const $toggle of $toggles) {
            $toggle.classList.remove('on', 'off');
            $toggle.classList.add(v ? 'on' : 'off');
            // Listen
            $toggle.addEventListener('click', async () => {
                const value = $toggle.classList.contains('off');
                await BG.exec('set_settings', {id: k, value: value});
                $toggle.classList.remove('on', 'off');
                $toggle.classList.add(value ? 'on' : 'off');
            });
        }

        const $options = document.querySelectorAll(`.settings_dropdown[data-settings="${k}"]`);
        for (const $option of $options) {
            if ($option.dataset.value === v) {
                $option.classList.add('selected');
                document.querySelector($option.dataset.displays).innerHTML = $option.innerHTML;
            }
            // Listen
            $option.addEventListener('click', async () => {
                document.querySelector(`.settings_dropdown.selected[data-settings="${k}"]`)?.classList?.remove('selected');
                const value = $option.dataset.value;
                await BG.exec('set_settings', {id: k, value: value});
                $option.classList.add('selected');
                document.querySelector($option.dataset.displays).innerHTML = $option.innerHTML;
            });
        }

        const $texts = document.querySelectorAll(`.settings_text[data-settings="${k}"]`);
        for (const $text of $texts) {
            $text.value = v;
            // Listen
            $text.addEventListener('input', async () => {
                const value = $text.value;
                await BG.exec('set_settings', {id: k, value: value});
                console.log(k, value);
            });
        }
    }

    /**
     * Locate element
     */

    for (const $e of document.querySelectorAll('.locate')) {
        $e.addEventListener('click', async () => {
            const key = $e.dataset.key;
            await BG.exec('relay', {locate: key});
            window.close();
        });
    }

    /**
     * Export settings
     */

    document.querySelector('#export').addEventListener('click', async () => {
        const settings = await BG.exec('get_settings');
        const url = SettingsManager.export(settings);
        window.open(url, '_blank');
    });
}


async function main() {
    await init_ui();

    // await initialize_ui();
    await check_plan();
    await render_plan();
    setInterval(render_plan, 500);
}


document.addEventListener('DOMContentLoaded', main);
