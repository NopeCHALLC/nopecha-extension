# NopeCHA Chrome Extension & Firefox Add-on

![PyPI - Version](https://img.shields.io/pypi/v/nopecha?label=PyPI&link=https%3A%2F%2Fnopecha.com&link=https%3A%2F%2Fnopecha.com%2Fpypi)
![NPM Version](https://img.shields.io/npm/v/nopecha?label=NPM&link=https%3A%2F%2Fnopecha.com&link=https%3A%2F%2Fnopecha.com%2Fnpm)
![GitHub Release](https://img.shields.io/github/v/release/NopeCHALLC/nopecha-extension?label=Extension%20Release&color=4a4&link=https%3A%2F%2Fnopecha.com&link=https%3A%2F%2Fnopecha.com%2Fgithub)
![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/dknlfmjaanfblgfdfebhijalfmhmjjjo?label=Chrome%20Web%20Store&color=4a4&link=https%3A%2F%2Fnopecha.com&link=https%3A%2F%2Fnopecha.com%2Fchrome)
![Mozilla Add-on Version](https://img.shields.io/amo/v/noptcha?label=Mozilla%20Add-on&color=4a4&link=https%3A%2F%2Fnopecha.com&link=https%3A%2F%2Fnopecha.com%2Ffirefox)

NopeCHA is a **free-to-use** automated CAPTCHA solver, compatible with multiple CAPTCHA types, and powered by advanced deep learning models via the [NopeCHA API](https://developers.nopecha.com).

### Why NopeCHA?

Staying up-to-date with frequently changing CAPTCHA challenges can be tedious.
That's why we've developed browser extensions for both Chrome and Firefox.
These extensions receive regular updates to support the latest CAPTCHA challenges, ensuring uninterrupted service for your automation scripts.
Once installed, NopeCHA autonomously handles CAPTCHAs, allowing you to focus on more important tasks.

### Getting Started

For developers interested in integrating NopeCHA into their projects, please consult our [API documentation](https://developers.nopecha.com/guides/extension_advanced).

To test the extension:
- [Chrome Extension](https://www.nopecha.com/chrome)
- [Firefox Add-on](https://www.nopecha.com/firefox)

### Supported CAPTCHA Types

Here's a sample of CAPTCHA types supported by NopeCHA, with more being added regularly:

| All versions of reCAPTCHA | Most versions of FunCAPTCHA |
:-:|:-:
![reCAPTCHA](assets/recaptcha.gif?raw=true) | ![FunCAPTCHA](assets/funcaptcha.gif?raw=true)

| All versions of hCaptcha | AWS WAF CAPTCHA |
:-:|:-:
![hCaptcha](assets/hcaptcha.gif?raw=true) | ![AWS WAF CAPTCHA](assets/awscaptcha.gif?raw=true)

| 300+ Types of Text CAPTCHA | Cloudflare Turnstile |
:-:|:-:|
![Text-based CAPTCHA](assets/textcaptcha.gif?raw=true) | ![Cloudflare Turnstile](assets/turnstile.gif?raw=true)

- PerimeterX
- GeeTest CAPTCHA
- Lemin CAPTCHA
- [View all supported CAPTCHAs](https://developers.nopecha.com/captcha/)

<br>

# Important Update: Transition to Closed-Source in 2023

### What's New?

Starting 2023, NopeCHA has transitioned to a closed-source model.
Despite this, we will continue to publish the latest builds under [Releases](../../releases).

### Why the Transition?

Earlier this year, hCaptcha and FunCAPTCHA added a hardcoded check to detect NopeCHA v0.3.x and open-source softwares developed by NopeCHA, LLC.
This attention validates our impact.
To maintain our edge without offering CAPTCHA providers a counter-strategy, we have chosen to restrict source code access.

<br>

<p align="center">
<img src="assets/hcaptcha_butterfly.gif?raw=true" width="240" /> <img src="assets/nopecha_banner_1.webp?raw=true" width="300" />
</p>

<br>

### Technical Advancements

Behind the scenes, NopeCHA is undergoing intense training and refinement.
Our neural network architecture continuously adapts to new challenges.
Whether it's decoding obscure characters or solving complex image-to-image tasks, NopeCHA is built for it.

### The Road Ahead

We're committed to refining our algorithms and expanding our library of solved CAPTCHAs.
While our advanced machine learning models give us a definitive edge, the story isn't over.
We will continue to push the boundaries of what's possible in CAPTCHA-solving technology.

Thanks for your support, and remember—in a world full of CAPTCHAs, be a NopeCHA. 😎✌️

<br>

![NopeCHA Digital Gym](assets/nopecha_banner_0.webp?raw=true)

<br>

# Following sections are DEPRECATED
> :warning: **Archival purposes only**

## Usage Examples
> :warning: **[Outdated examples due to Colab updates]**:

While it's possible to use NopeCHA in Colab, we're not actively supporting it.
If you're interested in using NopeCHA in Colab, you will need to change the code to get it working again.

NopeCHA Extension in Selenium

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1h9Q37yQqrLNhkqBCCWtHMPc09iOlLEQ5?usp=sharing)

NopeCHA Extension in Undetected Chromedriver

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1IAIwMWxpK7j1zzWJ1RmajD0TjaW_ANz4?usp=sharing)


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
