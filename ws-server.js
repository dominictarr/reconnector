
/*
  adapt the server end of a websocket emulator
  to EventEmitter style.
*/

var EventEmitter = require('events').EventEmitter

module.exports = function (ws) {
  var emitter = new EventEmitter ()
  function emit (args) {
    EventEmitter.prototype.emit.apply(emitter, args)
  }
  emitter.emit = function () {
    var args = [].slice.call(arguments)
    ws.write(JSON.stringify(args))
  }
  emitter.disconnect = function () {
    //the server does not require reconnections
    ws.close()
  }
  function onData (data) {
    emit(JSON.parse(data))
  }
  ws.on('data', onData) //browserchannel
  ws.on('message', onData) //sockjs
  ws.on('close', function () {
    emit(['disconnect'])
  }) 
  emitter.socket = ws
  emitter.id = ws.id
  return emitter
}
