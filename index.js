/*
  wrap a WebSocket (style) API with an EventEmitter
  making it more nodeish
*/
var EventEmitter = require('events').EventEmitter

module.exports = connector
function connector (create, emitter) {
  var ws = this._ws = create()
  var min = 500, max = 60e3
  emitter = emitter || new EventEmitter()
  var buffer = emitter._buffer = emitter._buffer || []
  emitter.timeout = emitter.timeout || min
  emitter.reconnect = true
  function emit(args) {
    console.log('emit', args)
    EventEmitter.prototype.emit.apply(emitter, args)
  }
  emitter.socket = ws
  emitter.emit = function () {
    var mess = JSON.stringify([].slice.call(arguments))+'\n'  
    if(emitter.connected) ws.send(mess)
    else                  buffer.push(mess)
  }
  ws.onmessage = function (data) {
    console.log('message', data, data.data)
    emit(JSON.parse(data.data))
  }
  ws.onclose = function () {
    emitter.connected = false
    emit(['disconnect']) 
    //remove listeners
    console.log('DISCONNECT')
    if(emitter.reconnect) autoreconnect()
    ws.onmessage = ws.onclose = ws.onopen = null
  }
  ws.onopen = function () {
    emit(['connect'])
    emitter.connected = true
    timeout = min
    while(buffer.length)
      ws.send(buffer.shift()) 
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
    if(emitter.connected) return
    clearTimeout(emitter._timer)
    connector(create, emitter)
    timeout = min
    console.log('FORCE RECONNECT')
    emit(['reconnecting', timeout])
  }
  emitter.disconnect = function () {
    ws.close()
    emitter.connected = false
    return this
  }
  return emitter
}
