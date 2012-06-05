/*
  wrap a WebSocket (style) API with an EventEmitter
  making it more nodeish
*/
var EventEmitter = require('events').EventEmitter

module.exports = connector
function connector (create, emitter) {
  //hmm, move this out into your own?
  var ws = this._ws = create()
  var min = 500, max = 60e3
  var sent = 0, received = 0

  emitter = emitter || new EventEmitter()
  emitter.connecting = true
  var buffer = emitter._buffer = emitter._buffer || []
  emitter.timeout = emitter.timeout || min
  emitter.reconnect = true
  function send(mess) {
    ws.send(mess)
    sent ++
  }
  function emit(args) {
    EventEmitter.prototype.emit.apply(emitter, args)
  }
  emitter.meter = setInterval(function () {
      emit(['flow', sent, received])
      sent = received = 0
    }, 1000)
  emitter.socket = ws
  emitter.emit = function () {
    var mess = JSON.stringify([].slice.call(arguments))+'\n'  
    if(emitter.connected) send(mess)
    else                  buffer.push(mess)
  }
  ws.onmessage = function (data) {
    received ++
    emit(JSON.parse(data.data))
  }
  ws.onclose = function () {
    clearTimeout(emitter.meter)
    emitter.connected = false
    emitter.connecting = false
    emit(['disconnect']) 
    //remove listeners
    if(emitter.reconnect) autoreconnect()
    ws.onmessage = ws.onclose = ws.onopen = null
  }
  ws.onopen = function () {
    emit(['connect'])
    emitter.connected = true
    emitter.connecting = false
    timeout = min
    while(buffer.length) send(buffer.shift()) 
  } 
  function autoreconnect () {
    emitter._timer = setTimeout (function () {
      connector(create, emitter)    
    }, emitter.timeout)
    emit(['reconnecting', emitter.timeout])
    emitter.timeout = emitter.timeout * 2
    if(emitter.timeout > max)
      emitter.timeout = max 
  }
  //reconnect NOW
  emitter.connect = function () {
    if(emitter.connected || emitter.connecting) return
    clearTimeout(emitter._timer)
    connector(create, emitter)
    timeout = min
    emit(['reconnecting', timeout])
  }
  emitter.disconnect = function () {
    ws.close()
    emitter.connected = false
    return this
  }
  return emitter
}
