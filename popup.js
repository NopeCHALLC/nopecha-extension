let plan = null;
let checking_server_plan = false;
let rendering_server_plan = false;


function sleep(t) {
    return new Promise(resolve => setTimeout(t));
}


function get_loading_html() {
    return '<div class="loading"><div></div><div></div><div></div><div></div></div>';
}


function number_with_comma(n) {
    n = !n ? 0 : n;
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


async function check_plan() {
    const settings = await BG.exec('Settings.get');
    if (!settings) {
        return;
    }

    if (checking_server_plan) {
        return;
    }
    checking_server_plan = true;

    plan = await BG.exec('Server.get_plan', {key: settings.key});  // plan = {plan, credit, quota, duration, lastreset}

    if (plan.error) {
        plan = {
            error: true,
            plan: plan.message,
            credit: 0,
            quota: 0,
            duration: null,
            lastreset: null,
            current_period_start: 1,
            current_period_end: 1,
        };
    }

    plan.subscription = ['Starter', 'Basic', 'Professional', 'Enterprise'].includes(plan.plan);
    plan.invalid = false;
    if (['Banned IP', 'Invalid key', 'Rate limit reached'].includes(plan.plan)) {
        plan.invalid = true;
    }
    else {
        plan.plan = `${plan.plan} Plan`;
    }

    plan.expired = false;
    if (plan.subscription) {
        const now = Date.now() / 1000;
        const delta = plan.current_period_end - now;
        if (delta < 0) {
            plan.expired = true;
            plan.credit = 0;
            plan.quota = 0;
        }
    }

    checking_server_plan = false;

    const $loading_overlay = document.querySelector('#loading_overlay');
    $loading_overlay.classList.add('hidden');
}


async function render_plan() {
    const settings = await BG.exec('Settings.get');
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
    if (plan.invalid || plan.error) {
        $plan.classList.add('red');
    }
    else {
        $plan.classList.remove('red');
    }

    // Display banned message
    if (plan.plan === 'Banned IP') {
        $ipbanned_warning.classList.remove('hidden');
    }
    else {
        $ipbanned_warning.classList.add('hidden');
    }

    // Display remaining credits
    $credit.innerHTML = `${number_with_comma(plan.credit)} / ${number_with_comma(plan.quota)}`;
    if (plan.credit === 0) {
        $credit.classList.add('red');
    }
    else {
        $credit.classList.remove('red');
    }

    // Display time until reset
    if (plan.expired) {
        $refills.innerHTML = 'Expired';
        $refills.classList.add('red');
    }
    else {
        if (plan.duration < 0) {
            $refills.innerHTML = 'No refills';
            $refills.classList.add('red');
        }
        else if (secs_until_reset) {
            const hms = Time.seconds_as_hms(secs_until_reset);
            $refills.innerHTML = `${hms}`;
            $refills.classList.remove('red');
        }
        else {
            $refills.innerHTML = get_loading_html();
            $refills.classList.remove('red');
        }

        // Plan may have been reset. Fetch data from server
        if (plan.lastreset === 1) {
            $refills.innerHTML = 'Not activated';
            $refills.classList.add('red');
        }
        else if (plan.duration > 0 && secs_until_reset === 0) {
            await sleep(1000);
            await check_plan();
        }
    }


    rendering_server_plan = false;
}


async function init_ui() {
    const settings = await BG.exec('Settings.get');
    console.log('settings', settings);


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
            await BG.exec('Settings.set', {id: 'enabled', value: true});
            await BG.exec('Icon.set', {status: 'on'});
            last_anim = setTimeout(() => {
                $power_spinning.classList.add('hidden');
                $power_static.classList.remove('hidden');
            }, 1000);
        }
        else {
            await BG.exec('Settings.set', {id: 'enabled', value: false});
            await BG.exec('Icon.set', {status: 'off'});
            $power_btn.classList.add('off');
        }
    });


    /**
     * Subscription key
     */

    const $key = document.querySelector('.settings_text[data-settings="key"]');
    const $edit_icon = document.querySelector('.edit_icon');
    const $key_label = document.querySelector('.key_label');
    function toggle_edit_key() {
        if ($key.classList.contains('hiddenleft')) {
            $key.classList.remove('hiddenleft');
            $key.focus();
            $edit_icon.classList.remove('hidden');
            $key_label.classList.add('hidden');
        }
        else {
            $key.classList.add('hiddenleft');
            $edit_icon.classList.add('hidden');
            $key_label.classList.remove('hidden');
        }
    }
    document.querySelector('#edit_key').addEventListener('click', () => {
        toggle_edit_key();
        check_plan();
    });
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
                await BG.exec('Settings.set', {id: k, value: value});
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
                await BG.exec('Settings.set', {id: k, value: value});
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
                await BG.exec('Settings.set', {id: k, value: value});
                // console.log(k, value);
            });
        }
    }


    /**
     * Locate element
     */

    for (const $e of document.querySelectorAll('.locate')) {
        $e.addEventListener('click', async () => {
            const key = $e.dataset.key;
            await BG.exec('Relay.send', {data: {action: 'start_locate', locate: key}});
            // await BG.exec('Relay.send', {action: 'start_locate', locate: key});
            window.close();
        });
    }


    /**
     * Disabled hosts
     */

    const $bl = document.querySelector('#disabled_hosts');
    async function set_disabled_hosts(render=true) {
        const hosts = new Set();
        for (const e of settings.disabled_hosts) {
            hosts.add(e.trim());
        }
        settings.disabled_hosts = [...hosts];
        await BG.exec('Settings.set', {id: 'disabled_hosts', value: settings.disabled_hosts});
        if (render) {
            await render_disabled_hosts();
        }
    }
    async function set_current_host() {
        const active_tab = await BG.exec('Tab.active');
        const active_url = active_tab.url ? active_tab.url : 'Unknown Host';
        const current_host = active_url.replace(/^(.*:)\/\/([A-Za-z0-9\-\.]+)(:[0-9]+)?(.*)$/, '$2');
        const $current_host = document.querySelector('#current_page_host');
        $current_host.innerHTML = current_host;

        let can_add = true;
        if (!active_tab.url || settings.disabled_hosts.includes(settings.disabled_hosts)) {
            can_add = false;
        }

        const $add_current_host = document.querySelector('#add_current_page_host');
        if (can_add) {
            $add_current_host.addEventListener('click', async () => {
                settings.disabled_hosts.push(current_host);
                await set_disabled_hosts();
            });
        }
        else {
            $add_current_host.disabled = true;
        }
    }
    async function render_disabled_hosts() {
        $bl.innerHTML = '';  // Clear disabled_hosts

        const $bl_item_template = document.querySelector('#template > #disabled_hosts_item');
        let change_delay_timer = null;

        for (const i in settings.disabled_hosts) {
            const e = settings.disabled_hosts[i]?.trim();
            if (!e) {
                continue;
            }
            const $e = $bl_item_template.cloneNode(true);
            $e.id = null;
            // Change hostname
            const $input = $e.querySelector('input.hostname');
            $input.value = e;
            $input.addEventListener('input', () => {
                clearTimeout(change_delay_timer);
                console.log('$input.value', $input.value);
                settings.disabled_hosts[i] = $input.value;
                change_delay_timer = setTimeout(async () => {
                    await set_disabled_hosts(false);
                }, 200);
            });
            // Remove hostname
            const $remove = $e.querySelector('.remove');
            $remove.addEventListener('click', () => {
                const index = settings.disabled_hosts.indexOf($input.value);
                if (index !== -1) {
                    settings.disabled_hosts.splice(index, 1);
                    set_disabled_hosts(false);
                }
                $e.remove();
            });
            $bl.append($e);
        }
    }
    set_current_host();
    render_disabled_hosts();


    /**
     * Export settings
     */

    document.querySelector('#export').addEventListener('click', async () => {
        const settings = await BG.exec('Settings.get');
        const url = SettingsManager.export(settings);
        window.open(url, '_blank');
    });


    /**
     * Footer
     */
    const VERSION = `Version ${chrome.runtime.getManifest().version}`;
    for (const $footer of document.querySelectorAll('.footer')) {
        const $version = document.createElement('div');
        $version.innerHTML = VERSION;
        const $copyright = document.createElement('div');
        $copyright.innerHTML = `2022 NopeCHA`;
        $footer.append($version);
        $footer.append($copyright);
    }
}


async function main() {
    await init_ui();
    await check_plan();
    await render_plan();
    setInterval(render_plan, 500);
}


document.addEventListener('DOMContentLoaded', main);
