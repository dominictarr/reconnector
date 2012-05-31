/*
  an integration test that starts your browser,
  and then checks that messages get through, and that it reconnects.
*/

var spawn = require('child_process').spawn
var port = ~~(Math.random()*40000) + 1000

var sockjs = require('sockjs')
var connect = require('connect')
var assert = require('assert')
var browserify = require('browserify')
var path = require('path')
var toEmitter = require('reconnector/ws-server')
var tests = 0
function ok(test, message) {
  console.log([test ? 'ok' : 'not ok', ++ tests, '--', message || ''].join(' '))
}
function end () {
  console.log(1+'..'+tests)
}

/*
  thinking I will pull this following bit out...
  ... into it's own module. I keep forgetting how to 
  set websocket libs. to this makes it easy.
*/

function defaults (obj, defaults) {
  obj = obj || {}
  for(var k in defaults)
    obj[k] = obj[k] || defaults[k]
  return obj
}

function createServer(opts) {
  opts = defaults(opts, {
    'prefix':'/smooth'
  })
  var sox = sockjs.createServer()
  var app = connect.createServer()
  var _listen = app.listen
  //TODO... automatically insert browserify and sock.
  app.listen = function () {
    var args = [].slice.call(arguments)
    sox.installHandlers(_listen.apply(app, args), {
      prefix: opts.prefix
    })
    return app
  }
/*
  REMEMBER to make sure that the javascript gets served.
  maybe inject it into the page?
  or is that too overbearing?
*/
  sox.on('connection', function () {
    var args = [].slice.call(arguments)
    args[0] = toEmitter(args[0])
    args.unshift('connection')
    app.emit.apply(app, args)
  })
  return app
}

//spawn('google-chrome', ['http://localhost:'+port])
var instance = Math.random(), connections = 0
createServer()
  .use(browserify('./client.js'))
  .use(function (req, res, next) {
    if(req.url == '/instance.js') {
      res.writeHead('content-type', 'application/javascript')
      res.end(';window.INSTANCE = ' + instance + ';')
    }
    else next()
  })
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

    emitter.emit('restartif', instance)
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

