Alfred Firefox Tab switcher
===========================

![demo gif](./demo.gif)

An [Alfred](https://www.alfredapp.com/) workflow to quickly switch between
firefox tabs.

# Installation

## Requirements

- [nodeJS](https://nodejs.org/en/) (tested with version 13.7)
- [Node Package Manager (npm)](https://www.npmjs.com/) (usually installed alongside
    nodeJS)
- [Alfred](https://www.alfredapp.com/) + Powerpack License

## 1. Install the workflow

You need to install the workflow first as it will also install the native
messaging host component of the extension (required before the extension is
started).

```
mkdir -p "~/Library/Application Support/Mozilla/NativeMessagingHosts/"
npm install -g alfred-firefoxtabswitch
```

The workflow will register automatically with Alfred, and the
[Native Manifest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_manifests)
will be written automatically upon install at `/Library/Application Support/Mozilla/NativeMessagingHosts/alfredtabswitch.json`

## 2. Install the Firefox extension

Go to https://addons.mozilla.org/en-US/firefox/addon/alfred-tab-switch/ and
install it from there.

# Usage

Invoke the workflow with `fw` (you can customize that in Alfred), all opened
tabs (across all windows) will be shown.

If more than one argument is supplied to the workflow, all arguments must be
present in either the title or the URL.

Then simply hit ENTER on the tab you want to focus.


# Similar

I only discovered the existence of [a
pre-existing](https://github.com/deanishe/alfred-firefox) workflow by the
legendary @deanishe **after** doing all of this ... Yeah I know.

While my one focused on tab switching only, the other one is much more
featureful; so give that a try if you need more.

# Architecture

```
                                                    ┌───────────┐
                                                    │  Alfred   │
                                                    └───────────┘
                                                          ▲
                        ╭──────────────╮                  │
                        │ ◎ ○ ○ ░░░░░░░│                  │
                        ├──────────────┤            ┌─────┴─────┐
                        │              │            │UDP socket │
                        │              │            └─────┬─────┘
                        │              │                  │
                        │       ┌──────┴─────┐            ▼
                        └───────┤ Extension  ├───────────────────────────┐
                                └──────────┬─┘  Native Messaging Host    │
                                           └─────────────────────────────┘
```

The firefox extension will automatically spawn the native messaging host at
startup.

The host will open an UDP socket on port `52547` and listen for incoming
connections.

Alfred interacts with Firefox via the UDP socket, querying for the list of tabs,
and commanding to switch to a given tab. These inteactions are handled by the
`./host/client.js` file (spawned by alfred).

Each time the user issues a command, Alfred will spawn an instance of
`host/client.js`, which will talk to the UDP socket and kill itself when the
result is returned.

If the native messaging host fails to reply within 1 second, the client will
kill itself.


## Why so complex?

[Other workflows](https://github.com/stuartcryan/rapid-browser-tabs-for-alfred)
use Apple Script to switch tabs for Safari, Chrome etc.

But Firefox does not expose its tabs to the system, so the only way is to use an
extension with an native messaging component that allows alfred to communicate
with firefox.

# Troubleshooting

If shit ain't working, check the following (in that order):

## Check the native message host manifest

```bash
❯ cat ~/Library/Application\ Support/Mozilla/NativeMessagingHosts/alfredtabswitch.json
{
  "name": "alfredtabswitch",
  "description": "A Native Messaging host that enables quickly switching between tabs using Alfred",
  "path": "/usr/local/lib/node_modules/alfred-firefoxtabswitch/host/app.js",
  "type": "stdio",
  "allowed_extensions": [
    "alfredtabswitch@25.wf"
  ]
}  
```

## Check that the native messaging host is started by Firefox

Find the PID of the native messaging host process.
```bash
❯ lsof -i UDP:52547 # 52547 is the port used by our UDP socket.
COMMAND   PID  USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    13578 pyrho   56u  IPv4 0xef6cec813ce54835      0t0  UDP localhost:52547
```

Confirm with pstree that this is indeed a process spawned by firefox
```bash
❯ pstree -g3 -p 13578 # -p `PID`, we got the PID from the command above
─┬= 00001 root /sbin/launchd
 └─┬= 13534 pyrho /Applications/Firefox Developer Edition.app/Contents/MacOS/firefox
   └─── 13578 pyrho /usr/local/bin/node /usr/local/lib/node_modules/alfred-firefoxtabswitch/host/app.js /Users/pyrho/Library/Application Support/Moz
```

If you have a similar output, the issue is elsewhere.

## Open the extension debugger
Open firefox and go to `about:devtools-toolbox?type=extension&id=alfredtabswitch%4025.wf`
check the console and see if there is any error messages.

## Try the client manually
Go to `/usr/local/lib/node_modules/alfred-firefoxtabswitch/host` and run `❯ node client.js get`, you should be greeted 
with a JSON object representing the list of tabs:
```json
{
	"items": [
		{
			"title": "Purify - Functional programming library for TypeScript",
			"subtitle": "https://gigobyte.github.io/purify/adts/Maybe",
			"arg": "0:3"
		}
	]
}
```

## Enable native messaging host debug logs
Go to `/usr/local/lib/node_modules/alfred-firefoxtabswitch/host`, and edit he
`utils.js` file to uncomment the line with the `appendFileSync`

This will log some information to the specified file.

Do not try to launch the host (app.js) manually, that is not how native
messaging works (well you can, but it won't really do anything).
