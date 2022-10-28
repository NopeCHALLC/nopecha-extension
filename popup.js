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
        // const files = $e.dataset.inject.split(',');
        $e.addEventListener('click', async () => {
            // BG.exec('inject_files', {files});
            const key = $e.dataset.key;
            BG.exec('relay', {autodetect: key});
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
    $plan.innerHTML = plan.plan;
    if (plan.error) {
    // if (plan.plan === 'Invalid key') {
        $plan.classList.remove('green');
        $plan.classList.add('red');
    }
    else {
        $plan.classList.remove('red');
        $plan.classList.add('green');
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
        $credit.classList.remove('green');
        $credit.classList.remove('red');
        $credit.innerHTML = '<div class="loading"><div></div><div></div><div></div><div></div></div>';
    }
    else {
        $credit.innerHTML = `${plan.credit} / ${plan.quota}`;
        if (plan.credit === 0) {
            $credit.classList.remove('green');
            $credit.classList.add('red');
        }
        else {
            $credit.classList.remove('red');
            $credit.classList.add('green');
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


async function main() {
    await initialize_ui();
    await check_plan();
    await render_plan();
    setInterval(render_plan, 500);
}


document.addEventListener('DOMContentLoaded', main);
