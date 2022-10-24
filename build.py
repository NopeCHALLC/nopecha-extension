#! /bin/python3
import argparse
import contextlib
import itertools
import json
import os
import re
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
    "firefox": ".xpi",
    "chrome": ".crc",
}
OUTPUT_ARCHIVE_NAME = Path("NopeCHA.zip")
BASE_MANIFEST = Path("manifest.base.json")
EXPORT_PATH = Path("dist")
VERSIONS_PATH = Path("version")


watchdog_help = (
    f"""
Keeps the program running and makes use of the watchdog library to listen for changes.
When changes exist, the corresponding file is updated in {EXPORT_PATH} for the extension to update itself and use.
"""
).strip()

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
    description="Dev/deploy build extension for firefox and chrome",
    formatter_class=argparse.RawTextHelpFormatter,
)

parser.add_argument(
    "-p",
    "--production",
    action="store_true",
    help="Compresses files and creates zip file to submit for evaluation or test in the browser",
)
parser.add_argument("-w", "--watch", action="store_true", help=watchdog_help)

program_args = parser.parse_args()

if watchdog is None and program_args.watch:
    parser.print_help()
    printe(f"\nERROR: \n {WATCHDOG_NOT_FOUND}\n")
    exit(2)


## Polyfill Python will remove link_to in python 3.12
if not hasattr(Path, "hardlink_to"):

    def hardlink_to_polyfill(self, target):
        return target.link_to(self)

    Path.hardlink_to = hardlink_to_polyfill


@contextlib.contextmanager
def in_dir(new_path):
    oldcwd = os.getcwd()
    try:
        os.chdir(new_path)
        yield
    finally:
        os.chdir(oldcwd)


def uglify(file: Path):
    return subprocess.check_output(
        [
            "uglifyjs",
            "--compress",
            "--mangle",
            "--no-annotations",
            "-c",
            "drop_console",
            "--",
            os.fspath(file.absolute()),
        ]
    )


def process_file(source, dist_path, export_directory, zip):
    target = export_directory / dist_path
    target.parent.mkdir(parents=True, exist_ok=True)

    try:
        # hardlinks take a fraction of time related to copy&paste
        # Unfortunately, some platforms don't implement or allow them for regular users (E.g. windows)
        target.hardlink_to(source)
        # Don't show the user a hard link is tried when the feature is not implemented
        printe("debug: hardlinked", source)
    except NotImplementedError:  # Not implemented in windows
        printe("debug: copy", source)
        shutil.copy(source, target)
    except Exception:
        # Pretends the hardlink was tried but an error happened
        printe("debug: hardlink", source)
        raise

    if zip:
        if source.suffix == ".js":
            printe("release: uglify js", source)
            zip_content = uglify(source)
        else:
            printe("release: include file", source)
            zip_content = source.read_bytes()

        zip.writestr(os.fspath(dist_path), zip_content)


dir_path = Path(__file__).absolute().parent

with in_dir(dir_path):

    def build():
        here_path = Path(".")

        # This is slow but there should be very few files, so it should be OK
        files_to_include = [
            f
            for f in itertools.chain(
                here_path.glob("*.html"),
                here_path.glob("*.css"),
                here_path.glob("*.js"),
                here_path.glob("*.mjs"),
                (here_path / "icon").iterdir(),
            )
            if f.name != "utils.js"
        ]

        versions = filter(lambda p: p.is_dir(), VERSIONS_PATH.iterdir())
        # This could be run just once per program run but it would bring unnecessary complexity to the code below
        shutil.rmtree(EXPORT_PATH, True)

        for version in versions:
            export_directory = EXPORT_PATH / version.name
            export_directory.mkdir(parents=True, exist_ok=True)

            if program_args.production:
                # Takes quite a while to make new zips. So better do it for final tests or when deploying
                extension_archive = EXPORT_PATH / OUTPUT_ARCHIVE_NAME.with_suffix(
                    EXTENSION_SUFFIXES[version.name]
                )
                zip_deploy = ZipFile(
                    extension_archive, "w", ZIP_DEFLATED, compresslevel=9
                )
            else:
                zip_deploy = contextlib.nullcontext()

            with zip_deploy as zip:

                printe("-" * 80)
                printe("packaging version", version)

                extension_manifest = json.loads(BASE_MANIFEST.read_text())

                # utils.js is a variation of utils.mjs but without the `export`
                version_files_to_include = filter(
                    lambda f: f.is_file() and f.name != "manifest.json",
                    version.iterdir(),
                )

                for file_to_include in files_to_include:
                    process_file(
                        file_to_include, file_to_include, export_directory, zip
                    )

                for version_file_to_include in version_files_to_include:
                    target_path = version_file_to_include.relative_to(version)
                    process_file(
                        version_file_to_include, target_path, export_directory, zip
                    )

                # utils.js is generated from utils.mjs so they can stay synchronized for both usages
                utils_module = Path("utils.mjs").read_text()
                printe("debug: generating utils from mutils")

                utils_js = re.sub(
                    r"^export (class|const|function)",
                    r"\1",
                    utils_module,
                    flags=re.MULTILINE,
                )
                (export_directory / "utils.js").write_text(utils_js)

                if zip:
                    printe("debug: store utils", version_manifest)
                    zip.writestr("utils.js", utils_js)

                version_manifest = version / "manifest.json"

                printe("debug: manifest", version_manifest)

                specific_manifest = json.loads(version_manifest.read_text())

                specific_manifest["permissions"].extend(
                    extension_manifest["permissions"]
                )
                extension_manifest.update(specific_manifest)

                manifest_content = json.dumps(extension_manifest, indent=4)
                (export_directory / "manifest.json").write_text(manifest_content)

                if zip:
                    printe("debug: store manifest", version_manifest)
                    zip.writestr(
                        "manifest.json", json.dumps(extension_manifest).encode("UTF-8")
                    )

    build()

    if program_args.watch:
        # All watchdog content here to "encapsulate" and only keep if wanted

        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler

        class FileEventHandler(FileSystemEventHandler):
            def on_modified(self, event):
                if (
                    not event.is_directory
                    and not os.fspath(EXPORT_PATH) in event.src_path
                ):
                    build()
                    printe("changes detected - rebuilt extension")
                    observer.event_queue.empty()

            on_created = on_modified

        observer = Observer()
        observer.schedule(FileEventHandler(), ".", recursive=True)
        observer.start()
        try:
            while True:
                time.sleep(1)
        finally:
            observer.stop()
            observer.join()
