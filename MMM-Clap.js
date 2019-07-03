//
// Module : MMM-Clap
//

Module.register("MMM-Clap", {
  defaults: {
    useDisplay:true,
    startOnBoot: true,

    detector: {
      recordBackbone: "alsa", // "waveaudio", "coreaudio"
      recordDevice: "plughw:1", // "-d", "default"
      thresholdDetectionStart: "5%", // minimum noise percentage threshold necessary to start recording sound (0~100%)
      thresholdDetectionEnd: "5%", // minimum noise percentage threshold necessary to end recording sound (0~100%)
      thresholdClapAmplitude: 0.7, // minimum amplitude threshold to be considered as clap (0~1)
      thresholdClapEnergy: 0.3, // maximum energy threshold to be considered as clap (0~1)
      duration: 500,
    },

    clapsTimeout:1000,
    sequenceTimeout:2000,

    defaultCommandMode: "MODE_DEFAULT",
    commands: {
      "MODE_DEFAULT": {
        "1": {
          moduleExec: {
            module: [],
            exec: (module) => {
              module.hide()
              if (module.name == "MMM-Clap") module.notificationReceived("CLAP_MODE", "MODE_HIDE")
            }
          },
          restart:true,
          alias: "COMMAND:HIDE"
        },
        "1-1": {
          moduleExec: {
            module: ["MMM-Clap"],
            exec:(module) => {
              console.log("Do something")
            }
          },
          restart:false,
          //alias: "test"
        }
      },
      "MODE_HIDE": {
        "1": {
          moduleExec: {
            module: [],
            exec: (module) => {
              module.show()
              if (module.name == "MMM-Clap") module.notificationReceived("CLAP_MODE", "MODE_DEFAULT")
            }
          },
          restart: true,
          alias: "COMMAND:SHOW"
        }
      }
    }
  },

  getStyles: function() {
    return ["MMM-Clap.css"]
  },

  start: function() {
    this.config.mic = Object.assign({}, this.defaults.mic, this.config.mic)
    this.commandMode = this.config.defaultCommandMode
  },

  socketNotificationReceived: function(noti, payload) {
    if (noti == "FINISHED") {

    }
    if (noti == "ALREADY_RUNNING") {
      console.log("[CLAP] Clap detection is already running.")
    }
    if (noti == "CUR_SEQUENCE") {
      var dom = document.getElementById("CLAP_SEQUENCE")
      dom.innerHTML = payload
      dom.className = "exist"
      var icon = document.getElementById("CLAP_ICON")
      icon.className = "normal"
    }

    if (noti == "FINAL_SEQUENCE") {
      this.sendSocketNotification("CLAP_DETECTED", payload)
      var cont = document.getElementById("CLAP_CONTAINER")
      cont.className = "final"
      this.doCommand(payload)
    }
  },

  notificationReceived: function(noti, payload, sender) {
    if (noti == "CLAP_RESUME") {
      this.startClap()
    }

    if (noti == "CLAP_PAUSE") {
      this.stopClap()
    }

    if (noti == "CLAP_MODE") {
      this.setMode(payload)
    }

    if (noti == "DOM_OBJECTS_CREATED" && this.config.startOnBoot) {
      this.startClap()
    }
  },

  doCommand: function(commandPattern) {
    if (this.config.commands.hasOwnProperty(this.commandMode)) {
      var commands = this.config.commands[this.commandMode]
      var command = null
      var commandName = commandPattern
      if (commands.hasOwnProperty(commandPattern)) {
        command = commands[commandPattern]
        commandName = (command.hasOwnProperty("alias")) ? command.alias : commandPattern
        console.log("[CLAP] Command will be executed:", commandName)
      } else {
        console.log("[CLAP] Undefined command pattern:", commandPattern)
      }
      var seq = document.getElementById("CLAP_SEQUENCE")
      seq.innerHTML = commandName
      var icon = document.getElementById("CLAP_ICON")
      icon.classList.add((command)? "matched" : "unmatched")
      this.executeCommand(command)
    } else {
      console.log("[CLAP] Invalid command mode:", this.commandMode)
      this.startClap()
    }
  },

  executeCommand: function(command = null) {
    if (command) {
      if (command.hasOwnProperty("notificationExec")) {
        var ex = command.notificationExec
        var nen = (ex.hasOwnProperty("notification")) ? ex.notification : this.config.notifications.DETECTED
        var nenf = (typeof nen == "function") ? nen(htoword, file) : nen
        var nep = (ex.hasOwnProperty("payload")) ? ex.payload : { hotword: hotword, file: file }
        var nepf = (typeof nep == "function") ? nep(hotword, file) : nep
        this.sendNotification(nenf, nepf)
      }
      if (command.hasOwnProperty("shellExec")) {
        var ex = command.shellExec
        var see = (ex.hasOwnProperty("exec")) ? ex.exec : null
        var seef = (typeof see == "function") ? see(hotword, file) : see
        if (seef) this.sendSocketNotification("SHELL_EXEC", seef)
      }
      if (command.hasOwnProperty("moduleExec")) {
        var ex = command.moduleExec
        var mem = (ex.hasOwnProperty("module")) ? ex.module : []
        var mem1 = (typeof mem == "function") ? mem() : mem
        var memf = (typeof mem1 == "string") ? [mem1] : mem1
        var mee = (ex.hasOwnProperty("exec")) ? ex.exec : null
        if (typeof mee == "function") {
          var modules = MM.getModules().enumerate((m) => {
            if (memf.includes(m.name) || memf.length == 0) {
              mee(m)
            }
          })
        }
      }
    }
    setTimeout(() => {
      if (command && command.hasOwnProperty("restart") && command.restart == false) {
        //do nothing
      } else {
        this.startClap()
      }
    }, 2000)
  },

  setMode: function(mode) {
    if (this.config.commands.hasOwnProperty(mode)) {
      console.log("[CLAP] Change Mode:", mode)
      this.commandMode = mode
    }
  },

  startClap: function() {
    var config = {
      detector: this.config.detector,
      clapsTimeout: this.config.clapsTimeout,
      sequenceTimeout: this.config.sequenceTimeout,
    }
    this.sendSocketNotification("START", config)
    this.updateDom()
  },

  stopClap: function() {
    this.sendSocketNotification("STOP")
  },


  getDom: function() {
    var dom = document.createElement("div")
    dom.id = "CLAP"
    dom.className = (this.config.useDisplay) ? "shown" : "hidden"
    var container = document.createElement("div")
    container.id = "CLAP_CONTAINER"
    var icon = document.createElement("div")
    icon.id = "CLAP_ICON"
    icon.className = "normal"
    var text = document.createElement("div")
    text.id = "CLAP_SEQUENCE"
    text.className = "noexist"
    container.appendChild(icon)
    container.appendChild(text)
    dom.appendChild(container)
    return dom
  }

})
