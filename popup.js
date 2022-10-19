// const $log = document.querySelector('#log');
// const logs = [];
// function log(s) {
//     if (!$log)
//         return;
//     logs.push(s);
//     $log.innerHTML = logs.join('\n');
//     $log.scrollTop = $log.scrollHeight;
// }



let plan = null;
let checking_server_plan = false;
let rendering_server_plan = false;


async function check_plan() {
    const settings = await BG.exec('get_settings');
    console.log("got settings", settings);
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
    // log(JSON.stringify(settings));

    async function set_switch(id, enabled) {
        const $switch = document.querySelector(`input#${id}[type="checkbox"]`);
        if (!$switch)
            return;

        const disables = $switch.dataset?.disables?.split(',');
        if (disables) {
            for (const disable_id of disables) {
                const $e = document.querySelector(`#${disable_id}`);
                if (enabled)
                    $e.disabled = false;
                else
                    $e.disabled = true;
            }
        }

        // log(`set_switch ${id} ${enabled}`);
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

            if (isNaN(value))
                value = 0;
            if (value < 0)
                value = 0;
            if (value > 999999)
                value = 999999;
        }

        // log(`set_field ${id} ${value}`);
        $field.value = value;
        await BG.exec('set_settings', {id: id, value: value});
    }

    async function set_select(id, value) {
        const $select = document.querySelector(`select#${id}`);
        if (!$select)
            return;

        // log(`set_select ${id} ${value}`);
        $select.value = value;
        await BG.exec('set_settings', {id: id, value: value});
    }

    for (const k in settings) {
        try {
            await set_switch(k, settings[k]);
            await set_field(k, settings[k]);
            await set_select(k, settings[k]);
        } catch {}
    }

    const $switches = document.querySelectorAll('.settings_group input[type="checkbox"]');
    for (const $e of $switches) {
        $e.addEventListener('change', () => set_switch($e.id, $e.checked));
    }

    const $fields = document.querySelectorAll('.settings_group input[type="text"]');
    for (const $e of $fields) {
        $e.addEventListener('input', () => set_field($e.id, $e.value));
    }

    const $selects = document.querySelectorAll('.settings_group select');
    for (const $e of $selects) {
        $e.addEventListener('change', () => set_select($e.id, $e.value));
    }

    // Manage subscription
    document.querySelector('#manage').addEventListener('click', async () => {
        await BG.exec('open_tab', {url: 'https://nopecha.com/manage'});
    });

    // Tech support
    document.querySelector('#footer').addEventListener('click', async () => {
        await BG.exec('open_tab', {url: 'https://nopecha.com/discord'});
    });

    // Subscription key changed
    let change_delay_timer = null;
    document.querySelector('#key').addEventListener('input', () => {
        clearTimeout(change_delay_timer);
        change_delay_timer = setTimeout(check_plan, 500);
    });

    // Tab switching
    for (const $e of document.querySelectorAll('.tab_btn')) {
        const target = $e.dataset.target;
        $e.addEventListener('click', () => {
            for (const $tab of document.querySelectorAll('.tab')) {
                $tab.classList.add('hidden');
            }
            for (const $tab_btn of document.querySelectorAll('.tab_btn')) {
                $tab_btn.classList.remove('active');
            }
            $e.classList.add('active');
            document.querySelector($e.dataset.target).classList.remove('hidden');
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
    const $incorrect_key = document.querySelector('#incorrect_key');
    const $ipbanned_warning = document.querySelector('#ipbanned_warning');

    const now = Date.now() / 1000;
    let secs_until_reset = null;
    if (plan.lastreset && plan.duration) {
        secs_until_reset = Math.floor(Math.max(0, plan.duration - (now - plan.lastreset)));
    }

    // Display plan name
    $plan.innerHTML = plan.plan;
    if (plan.plan === 'free') {
        if (settings.key !== '') {
            $incorrect_key.classList.remove('hidden');
        }
        else {
            $incorrect_key.classList.add('hidden');
        }
        $plan.classList.remove('green');
        $plan.classList.add('red');
    }
    else {
        $incorrect_key.classList.add('hidden');
        $plan.classList.remove('red');
        $plan.classList.add('green');
    }

    if(plan.plan.includes("Banned")) {
        $ipbanned_warning.classList.remove('hidden');
    } else {
        $ipbanned_warning.classList.add('hidden');
    }
    // if (['Invalid', 'Banned'].includes(plan.plan)) {
    //     // Show loading icon for remaining credit while the server resets quota
    //     $credit.classList.remove('green');
    //     $credit.classList.remove('red');
    //     $credit.innerHTML = document.querySelector('#template > .loading').cloneNode(true);
    //     $refills.innerHTML = document.querySelector('#template > .loading').cloneNode(true);
    //     return;
    // }

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
