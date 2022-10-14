#! /bin/python3
import argparse
import contextlib
import itertools
import json
import os
import shutil
import subprocess
import sys
import time
from functools import partial
from glob import glob
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

printe = partial(print, file=sys.stderr)

try:
    import watchdog
except ModuleNotFoundError:
    watchdog = None  # Not mandatory

EXTENSION_SUFFIXES = {
    'firefox': '.xpi',
    'chrome': '.crc',
}
OUTPUT_ARCHIVE_NAME = Path('NopeCHA.zip')
BASE_MANIFEST = Path('manifest.base.json')
EXPORT_PATH = Path('dist')
VERSIONS_PATH = Path('version')


watchdog_help = (f"""
Keeps the program running and makes use of the watchdog library to listen for changes.
When changes exist, the corresponding file is updated in {EXPORT_PATH} for the extension to update itself and use.
""").strip()

WATCHDOG_NOT_FOUND = f"""
    watchdog was not found. Execute the command below if you want to use the -w/--watch feature:
    python -m pip install watchdog
""".strip()

if watchdog is None:
    watchdog_help += f"""
Warning:
{WATCHDOG_NOT_FOUND}
"""

parser = argparse.ArgumentParser(
    description='Dev/deploy build extension for firefox and chrome',
    formatter_class=argparse.RawTextHelpFormatter
)

parser.add_argument('-p', '--production', action="store_true", help="Compresses files and creates zip file to submit for evaluation or test in the browser")
parser.add_argument('-w', '--watch', action="store_true", help=watchdog_help)

program_args = parser.parse_args()

if watchdog is None and program_args.watch:
    parser.print_help()
    printe(f"\nERROR: \n {WATCHDOG_NOT_FOUND}\n")
    exit(2)

@contextlib.contextmanager
def in_dir(new_path):
    oldcwd = os.getcwd()
    try:
        os.chdir(new_path)
        yield
    finally:
        os.chdir(oldcwd)

dir_path = Path(__file__).absolute().parent

with in_dir(dir_path):

    def deploy():
        here_path = Path('.')

        # This is slow but there should be very few files, so it should be OK
        files_to_include = list(itertools.chain(
            here_path.glob('*.html'),
            here_path.glob('*.css'),
            here_path.glob('*.js'),
            (here_path / 'icon').iterdir(),
        ))

        versions = filter(lambda p: p.is_dir(), VERSIONS_PATH.iterdir())
        # This could be run just once per program run but it would bring unnecessary complexity to the code below
        shutil.rmtree(EXPORT_PATH, True)

        for version in versions:
            export_directory = EXPORT_PATH / version.name
            export_directory.mkdir(parents=True, exist_ok=True)

            if program_args.production:
                # Takes quite a while to make new zips. So better do it for final tests or when deploying
                extension_archive = export_directory / OUTPUT_ARCHIVE_NAME.with_suffix(EXTENSION_SUFFIXES[version])
                zip_deploy = ZipFile(extension_archive, 'w', ZIP_DEFLATED, compresslevel=9)
            else:
                zip_deploy = contextlib.nullcontext()

            with zip_deploy as zip:

                printe('-' * 80)
                printe('packaging version', version)

                extension_manifest = json.loads(BASE_MANIFEST.read_text())

                version_files_to_include = filter(lambda f: f.is_file(), version.iterdir())

                for file_to_include in itertools.chain(files_to_include, version_files_to_include):
                    exported_file = export_directory / file_to_include
                    exported_file.parent.mkdir(parents=True, exist_ok=True)
                    try:
                        # hardlinks take a fraction of time related to copy&paste
                        # Unfortunately, some platforms don't implement or allow them for regular users (E.g. windows)
                        file_to_include.link_to(exported_file)
                        # Don't show the user a hard link is tried when the feature is not implemented
                        printe('debug: hardlinked', file_to_include)
                    except NotImplementedError:  # Not implemented in windows
                        printe('debug: copy', file_to_include)
                        shutil.copy(file_to_include, exported_file)
                    except Exception:
                        printe('debug: hardlink', file_to_include)  # Pretends the hardlink was tried but an error happened
                        raise

                    if zip:
                        if file_to_include.suffix == '.js':
                            printe('release: uglify js', file_to_include)
                            zip_content = subprocess.check_output([
                                'uglifyjs', '--compress', '--mangle', '--no-annotations', '-c', 'drop_console',
                                '--', os.fspath(file_to_include.absolute())
                            ])
                        else:
                            printe('release: include file', file_to_include)
                            zip_content = file_to_include.read_bytes()

                        zip.writestr(os.fspath(file_to_include), zip_content)

                version_manifest = version / 'manifest.json'

                printe('debug: manifest', version_manifest)

                specific_manifest = json.loads(version_manifest.read_text())

                specific_manifest['permissions'].extend(extension_manifest['permissions'])
                extension_manifest.update(specific_manifest)

                manifest_content = json.dumps(extension_manifest, indent=4)
                (export_directory / 'manifest.json').write_text(manifest_content)

                if zip:
                    printe('debug: store manifest', version_manifest)
                    zip.writestr('manifest.json', json.dumps(extension_manifest).encode('UTF-8'))

    deploy()

    if program_args.watch:
        # All watchdog content here to "encapsulate" and only keep if wanted

        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler

        class FileEventHandler(FileSystemEventHandler):

            def on_modified(self, event):
                if not event.is_directory and not os.fspath(EXPORT_PATH) in event.src_path:
                    deploy()
                    printe("updated")
                    observer.event_queue.empty()

            on_created = on_modified

        observer = Observer()
        observer.schedule(FileEventHandler(), '.', recursive=True)
        observer.start()
        try:
            while True:
                time.sleep(1)
        finally:
            observer.stop()
            observer.join()
