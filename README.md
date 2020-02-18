Alfred Firefox Tab switcher
===========================

**/!\ WIP /!\**

An [Alfred](https://www.alfredapp.com/) workflow to quickly switch between
firefox tabs.

```
                                                    ┌───────────┐
                                                    │  Alfred   │
                 ╭──────────────────────╮           └───────────┘
                 │ ◎ ○ ○ ░░░░░░░░░░░░░░░│                 ▲
                 ├──────────────────────┤                 │
                 │                      │                 │
                 │                      │                 │
                 │                      │                 │
                 │                      │                 │
                 │                      │                 │
                 │              ┌───────┴────┐            ▼
                 └──────────────┤ Extension  ├───────────────────────────┐
                                └──────────┬─┘  Native Messaging Host    │
                                           └─────────────────────────────┘
```

# Why so complex?

[Other workflows](https://github.com/stuartcryan/rapid-browser-tabs-for-alfred)
use Apple Script to switch tabs for Safari, Chrome etc. But
Firefox does not expose its tabs to the system, so the only way is to use an
extension with an native messaging component that allows alfred to communicate
with firefox.

# Installation

## Install the Firefox extension
TODO

## Install the workflow

TODO

```
npm install -g alfred-firefoxtabswitch
```

The workflow will register automatically with Alfred, and the
[Native Manifest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_manifests)
will be written automatically upon install at `/Library/Application Support/Mozilla/NativeMessagingHosts/alfred-firefoxtabswitch.json`

Todo
----
- [ ] Install native messaging host
    - ❯ npm -g root: /usr/local/lib/node_modules
- [ ] Publish FF extension
- [ ] Publish workflow as NPM module

