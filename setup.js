const url = new URL(document.location);


if (document.location.hash) {
    document.body.innerText = "Loading...";
    BG.exec("set_settings", { id: "key", value: document.location.hash.substring(1) })
        .then(() => document.body.innerText = "Key set!");
}
else {
    document.body.innerText = "Missing key. Please set the hash and reload the page.\nExample: https://nopecha.com/setup#sub_testkey1234";
}
