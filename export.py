# npm install uglify-js -g


import json
import os
import shutil


class util:
    class json:
        @staticmethod
        def load(fp):
            if not os.path.exists(fp):
                raise Exception(f"json does not exist {fp}")
            with open(fp, 'r') as f:
                return json.loads(f.read())

        @staticmethod
        def save(fp, data):
            with open(fp, 'w') as f:
                return f.write(json.dumps(data))


    class path:
        @staticmethod
        def join(*args):
            return os.path.join(*args).replace('\\', '/')

        @staticmethod
        def files(d, fullpath=True):
            e = [f for f in os.listdir(d) if os.path.isfile(os.path.join(d, f))]
            if fullpath:
                e = [os.path.join(d, f) for f in e]
            return [os.path.normpath(f) for f in e]

        @staticmethod
        def dirs(d, fullpath=True):
            e = [f for f in os.listdir(d) if os.path.isdir(os.path.join(d, f))]
            if fullpath:
                e = [os.path.join(d, f) for f in e]
            return [os.path.normpath(f) for f in e]


COMMON_FILES = [
    'icon/16.png',
    'icon/32.png',
    'icon/48.png',
    'icon/128.png',
    'hcaptcha_fast.js',
    'hcaptcha.js',
    'popup.html',
    'popup.js',
    'popup.css',
    'recaptcha_fast.js',
    'recaptcha_voice.js',
    'recaptcha.js',
    'utils.js',
]

VERSIONS = {
    'chrome': {
        'files': [
            'version/chrome/manifest.json',
            'version/chrome/background.js',
        ],
        'release': '../__export__/release/captcha_chrome',
        'debug': '../__export__/debug/captcha_chrome',
    },
    'firefox': {
        'files': [
            'version/firefox/manifest.json',
            'version/firefox/background.js',
        ],
        'release': '../__export__/release/captcha_firefox',
        'debug': '../__export__/debug/captcha_firefox',
    },
}

for version, data in VERSIONS.items():
    print('-' * 80)
    print('packaging version', version)

    # Remove existing export directories
    try:
        shutil.rmtree(data['debug'])
    except:
        pass
    try:
        shutil.rmtree(data['release'])
    except:
        pass
    # Remove existing zip files
    try:
        os.remove(f"{data['release']}.zip")
    except:
        pass

    # Export files
    files = [*COMMON_FILES, *data['files']]
    for fp in files:
        dst_path = fp
        if fp in data['files']:
            dst_path = '/'.join(fp.split('/')[2:])

        # Export debugging files
        debug_dst = f"{data['debug']}/{dst_path}"
        os.makedirs(os.path.dirname(debug_dst), exist_ok=True)
        print('debug: copy file', fp, debug_dst)
        shutil.copy(fp, debug_dst)

        # Export release files
        release_dst = f"{data['release']}/{dst_path}"
        os.makedirs(os.path.dirname(release_dst), exist_ok=True)
        if fp.endswith('.js'):
            print('release: uglify js', fp, release_dst)
            os.system(f"uglifyjs --compress --mangle --no-annotations -c drop_console --output {release_dst} -- {fp}")
        elif fp.endswith('.json'):
            print('release: minimize json', fp, release_dst)
            util.json.save(release_dst, util.json.load(fp))
        else:
            print('release: copy file', fp, release_dst)
            shutil.copy(fp, release_dst)

    # Create release zip
    print('zipping', data['release'], f"{data['release']}.zip")
    shutil.make_archive(data['release'], 'zip', data['release'])
