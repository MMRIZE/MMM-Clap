// Original : https://github.com/131/clap-trigger/blob/master/index.js
// Modified for MMM-Clap by eouia

"use strict"

var spawn   = require('child_process').spawn
const DefaultConfig = {
  recordBackbone: "alsa", // "waveaudio", "coreaudio"
  recordDevice: "plughw:1", // "-d", "default"
  thresholdDetectionStart: "10%", // minimum noise percentage threshold necessary to start recording sound (0~100%)
  thresholdDetectionEnd: "10%", // minimum noise percentage threshold necessary to end recording sound (0~100%)
  thresholdClapAmplitude: 0.7, // minimum amplitude threshold to be considered as clap (0~1)
  thresholdClapEnergy: 0.3, // maximum energy threshold to be considered as clap (0~1)
  duration: 500,
}

class Clap {


  constructor(config) {
    this.config = config
    this._started = false
  }

  get config() {
    return  this._config
  }

  set config(values) {
    this._config = Object.assign({}, DefaultConfig, values)
  }

  start (chain) {
    if (this._started) return chain("Already running")
    this._started = true
    this._listen((err)=>{
      chain()
    })
  }

  stop (chain) {
    this._started = false
    if (this.recorder) {
      this.recorder.kill()
      this.recorder = null
    }
  }

  _listen (chain) {
    if(!this._started) return chain("Listener not running")
    var args = ["-t"]
    args.push(this.config.recordBackbone, this.config.recordDevice)
    args.push("-t",  "wav", "-n")
    args.push("--no-show-progress")
    args.push("silence", "1", "0.0001", this.config.thresholdDetectionStart)
    args.push("1", "0.1", this.config.thresholdDetectionEnd)
    args.push("stat")
    var child = spawn("sox", args)
    var body  = ""

    this.recorder = child
    child.stderr.on("data", (buf) => {
      body += buf
    })

    child.on("exit", () => {
      var stats = this._parse(body)
      var clap = this.isClap(stats)
      if (clap) this._gotClap()
      this._listen(chain)
    })
  }

  _parse (body) {
    body = body.replace(new RegExp("[ \\t]+", "g") , " ") //sox use spaces to align output
    var split = new RegExp("^(.*):\\s*(.*)$", "mg")
    var match = null
    var dict = {} //simple key:value
    while(match = split.exec(body)) dict[match[1]] = parseFloat(match[2])
    return dict
  }

  isClap (stats) {
    var duration = stats['Length (seconds)']
    var rms = stats['RMS amplitude']
    var max = stats['Maximum amplitude']
    var isClap = true
      && duration < this.config.duration
      && max > this.config.thresholdClapAmplitude
      && rms < this.config.thresholdClapEnergy
    return isClap
  }

  _gotClap (){
    this.callback(Date.now())
  }

  onClap (callback=(time)=>{}) {
    this.callback = callback
  }
}



module.exports = Clap
