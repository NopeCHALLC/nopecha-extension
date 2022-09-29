### NopeCHA Chrome Extension & Firefox Add-on

# Usage

To build for both Chrome and Firefox, simply run the following command:

`python export.py`

This will create a `__export__` directory in the project root directory, in which you will find `release` and `debug` directories then `chrome` and `firefox` within each of them. Minified code for production can be found in the `release` directory. Zip file is created in the `release` directory for convenience during submission to the webstores.
