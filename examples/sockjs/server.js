var sockjs = require('sockjs')
var connect = require('connect')
var assert = require('assert')
var browserify = require('browserify')
var es = require('event-stream')
var fs = require('fs')
//TODO: allow both _bs(io) and _bs(connection)

var app = connect.createServer()

sox = sockjs.createServer({sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.js.min"})

app
  .use(connect.static(__dirname))
  .use(browserify(__dirname+'/client.js'))

sox.installHandlers(
  app.listen(3000, function () {
    console.log('BrowserStream example running on port 3000')
  })
, {prefix: '/echo'})

var toEmitter = require('reconnector/ws-server')

sox.on('connection', function (sock) {
  var emitter = toEmitter(sock)
  emitter.on('ping', function (data) {
    emitter.emit('pong', Date.now())
  })
})

