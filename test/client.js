var log = console.log

console.log = function () {
  var args = [].slice.call(arguments)
  var c = document.getElementById('console')
  //hmm, maybe this would be useful to put into a bit of a widget?
  c.innerHTML += args.map(JSON.stringify).join(' ') + '\n'
  log.apply(console, args) 
}

var emitter = require('skates')()

emitter.on('ping', function (sent) {
  var d = Date.now()
  console.log('pong', d, sent)
  emitter.emit('pong', d, d - sent)
})
.on('restartif', function (instance) {
  var ts =  RECONNECTOR.timestamp
  console.log('RESTARTIF', instance, '!==', ts, instance !== ts)
  if(ts !== instance)
    location.reload()
})
.on('disconnectrequest', function (password) {
  emitter.reconnect = true
  emitter.disconnect() //will reconnect
})
.on('goodbye', function () {
  console.log('passed')
  emitter.reconnect = false
  emitter.disconnect()
})

