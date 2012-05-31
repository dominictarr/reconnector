var reconnector = require('reconnector/ws-events')

emitter = reconnector(function () {
  return sock = new SockJS('/echo')
})

var ping 

setInterval(function () {
  if(emitter.connected)
    emitter.emit('ping', ping = Date.now())
}, 500)

emitter.on('pong', function (pong) {
  console.log('pong', ping, pong)
  console.log('latency:', pong - ping)
})

