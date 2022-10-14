## NopeCHA Chrome Extension & Firefox Add-on


## Development
### Prerequisites

Having [Python 3.8](https://python.org) or above installed.

### Building

To build debug copy for both Chrome and Firefox, simply run the following command:

`python build.py`

This will create a `dist` directory in the project root directory, in which you will find `firefox` and `chrome` directories for debugging purposes. If you use the `-p` argument, each debugging directory will have an additional xpi/crc archive for production usage.

### Actively listening for changes
For development convenience, `build.py` also supports listening to changes so files are quickly updated.

For that, you need to install python's `watchdog` in your machine:

`python -m pip install watchdog`

Then you can run `build.py` command with the `-w` option so your changes immediately apply:  

`python build.py -w`  
or  
`./build.py -w`


## Building for production
### Prerequisites

`npm install uglify-js -g`

### Build

`python build.py -p`

Note: The watchdog option `-w` is also supported here: (`python build.py -pw`)

Minified code for production can be found in the `.zip` files in the corresponding browser directory. The zip files can be used for final testing/debugging before sending them to the webstores.
