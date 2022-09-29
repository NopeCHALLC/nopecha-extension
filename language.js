(() => {
    console.log('window.location.href', window.location.href);
    const lang = 'en-US';
    Object.defineProperties(Navigator.prototype, {
        language: {
            value: lang,
            configurable: false,
            enumerable: true,
            writable: false,
        },
        languages: {
            value: [lang],
            configurable: false,
            enumerable: true,
            writable: false,
        },
    });
})();
