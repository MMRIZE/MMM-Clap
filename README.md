# MMM-Clap
Clap/Snap detector for MagicMirror


## Installation
0. PreInstall
**Linux (Raspbian, Ubuntu, ...)**
```sh
sudo apt-get install sox
```

**Mac OSX**
```sh
brew install sox
```

1. Install
```sh
cd ~/MagicMirror/modules
git clone https://github.com/eouia/MMM-Clap
```

## Configuration





## Usage
### Notification
- `CLAP_PAUSE` : You can pause this module by this notification. You might need to pause this module before other module trying to use Mic.
- `CLAP_RESUME` : You can resume this module by this notification.
- `CLAP_MODE`(payload: "ModeName") : You can change/set `commandMode` by this notification.

### CommandMode
This module can have several command modes, so you can assign same pattern to different commands by condition.
```js
defaultCommandMode: "COMMAND_MODE_DEFAULT"
commands: {
  "COMMAND_MODE_DEFAULT" : {
    "1": {
      // do something
    }
  },
  "COMMAND_MODE_ALTERNATIVE" : {
    "1": {
      // do other thing
    }
  }
}
```
You can change the commandMode by notification `CLAP_MODE`.

### Clap Sequence
```js
clapsTimeout:1000,
sequenceTimeout:2000,
```
By `clapsTimeout` and `sequenceTimeout`, you can define your clap pattern.

- `"1"` is clapping once and stop.
- `"2"` is clapping twice in `clapsTimeout`. (like Clap-Clap)
- `"1-1"` is clapping once, pausing over `clapsTimeout` but not `sequenceTimeout`, then clapping again. (like Clap-(pause)-Clap)

I don't recommend too complex pattern. You probably would make some mistakes on your clapping/finger-snapping.





### Example
#### Toggling Show/Hide by just 1 snap with commandMode
```js
defaultCommandMode: "Thanos",
commands: {
  "Thanos": {
    "1": {
      moduleExec: {
        module: [],
        exec: (module) => {
          module.hide()
          if (module.name == "MMM-Clap") module.notificationReceived("CLAP_MODE", "Avengers")
        }
      },
    },
  },
  "Avengers": {
    "1": {
      moduleExec: {
        module: [],
        exec: (module) => {
          module.show()
          if (module.name == "MMM-Clap") module.notificationReceived("CLAP_MODE", "Thanos")
        }
      },
    }
  }
}

```

#### Activate MMM-AssistantMk2
```js
defaultCommandMode: "DEFAULT"
commands: {
  "DEFAULT": {
    "1": {
      notificationExec: {
        notification: "ASSISTANT_ACTIVATE",
        payload: {profile: "default"}
      },
      restart:false
    }
  }
}
```
> You should call `CLAP_RESUME` & `CLAP_PAUSE` in MMM-AssistantMk2 to obtain/release MIC control.
