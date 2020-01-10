const ClapEngine = require("./clap.js")

var NodeHelper = require("node_helper")

module.exports = NodeHelper.create({
  start: function() {
    this.detector = null
  },

  socketNotificationReceived: function(noti, payload) {
    if (noti == "START") {
      this.startClap(payload)
    }
    if (noti == "STOP") {
      this.stopClap()
    }
  },

  stopClap: function(cb=()=>{}) {
    if(!this.detector) return console.log("[CLAP] Already Stopped.")
    this.detector.stop()
    this.detector = null
    console.log("[CLAP] Stops.")
    this.sendSocketNotification("FINISHED")
    cb()
  },


  startClap: function(config) {
    if (this.detector) {
      this.sendSocketNotification("ALREADY_RUNNING")
      console.log("[CLAP] Already running.")
    }
    console.log("[CLAP] Starts.")
    var sequence = []
    var sequenceTimer = null
    var seqIndex = 0
    var curClaps = 0
    var lastClapTime = null

    var processClap = (time) => {
      //console.log("[CLAP] Clap detected:", clap.timer, sequence )
      clearTimeout(sequenceTimer)
      sequenceTimer = null
      if (lastClapTime) {
        if (time > lastClapTime + config.clapsTimeout) {
          seqIndex++
          sequence[seqIndex] = 1
        } else {
          sequence[seqIndex]++
        }
      } else {
        sequence[seqIndex] = 1
      }

      lastClapTime = time
      var tempSeq = sequence.join("-")
      console.log("[CLAP] Detected:", tempSeq)
      this.sendSocketNotification("CUR_SEQUENCE", tempSeq)
      sequenceTimer = setTimeout(()=>{
        this.stopClap(()=>{
          this.sendSocketNotification("FINAL_SEQUENCE", tempSeq)
        })
      }, config.sequenceTimeout)
    }

    this.detector = new ClapEngine(config.detector)
    this.detector.onClap((time)=> {
      processClap(time)
    })
    this.detector.start((e=null)=>{
      if (e) console.log("[Clap] Interruption:", e)
    })
  },
})
