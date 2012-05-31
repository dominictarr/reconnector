/*
  an integration test that starts your browser,
  and then checks that messages get through, and that it reconnects.
*/

var spawn = require('child_process').spawn
var skates = require('skates')
var connect = require('connect')
var port = ~~(Math.random()*40000) + 1000
var assert = require('assert')
var tests = 0
function ok(test, message) {
  console.log([test ? 'ok' : 'not ok', ++ tests, '--', message || ''].join(' '))
}
function end () {
  console.log(1+'..'+tests)
}

var connections = 0
var app = skates()
  .use(connect.static('public'))
  .on('connection', function (emitter) {
    var pings = 0, pongs = 0
    connections ++
    console.log('connect client:', emitter.id)
    var interval = setInterval(function () {
      ok(true, 'ping')
      if(pings ++ > 5)
        clearInterval(interval)
      emitter.emit('ping', Date.now())
    }, 100)
    emitter.emit('restartif', app.timestamp)
    emitter.on('pong', function (time) {
      ok(true, 'pong ' + (Date.now() - time))
      if(pongs ++ > 5) {
        if(connections < 3) {
           ok(true, 'disconnect connection:' + connections)     
           emitter.disconnect()
     //     emitter.emit('disconnectrequest')
        } else {
          ok(true, 'saying goodbye')
          emitter.on('disconnect', function () {
            ok(true, 'PASSED')
            
            process.exit()
          })
          emitter.emit('goodbye')
        }
      }
    })
    .on('disconnect', function () {
      console.log('disconnect client:', emitter.id)
    })
  })
  .listen(port, function () {
     console.log('ReADY')
    spawn('google-chrome', ['http://localhost:'+port])
  })

