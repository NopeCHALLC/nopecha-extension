let plan = null;
let checking_server_plan = false;
let rendering_server_plan = false;


function get_loading_html() {
    return '<div class="loading"><div></div><div></div><div></div><div></div></div>';
}


function number_with_comma(n) {
    n = !n ? 0 : n;
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


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
        $credit.innerHTML = get_loading_html();
    }
    else {
        $credit.innerHTML = `${number_with_comma(plan.credit)} / ${number_with_comma(plan.quota)}`;
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
        $refills.innerHTML = get_loading_html();
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
            // Allow settings export when key is present
            if ($key.value.length > 0) {
                document.querySelector('#export').classList.remove('hidden');
            }
            else {
                document.querySelector('#export').classList.add('hidden');
            }
        }
    });
    // Allow settings export when key is present
    if (settings.key?.length > 0) {
        document.querySelector('#export').classList.remove('hidden');
    }
    else {
        document.querySelector('#export').classList.add('hidden');
    }

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
            await BG.exec('relay', {action: 'start_locate', locate: key});
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
    await check_plan();
    await render_plan();
    setInterval(render_plan, 500);
}


document.addEventListener('DOMContentLoaded', main);
