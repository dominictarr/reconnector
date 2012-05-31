var reconnector = require('reconnector')

var log = console.log

console.log = function () {
  var args = [].slice.call(arguments)
  
  var c = document.getElementById('console')
  c.innerHTML += args.map(JSON.stringify).join(' ') + '\n'
  log.apply(console, args) 
}

var emitter = reconnector(function () {
    return new SockJS('/smooth')
  })

emitter.on('ping', function (sent) {
  var d = Date.now()
  console.log('pong', d, sent)
  emitter.emit('pong', d, d - sent)
})
.on('restartif', function (instance) {
  console.log('RESTARTIF', instance, '!==', INSTANCE, instance !== INSTANCE)
  if(INSTANCE !== instance)
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

