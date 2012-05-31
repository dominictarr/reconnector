
function connector (opts, emitter) {
  //this module is not needed on the server side
  //just make a simple thing to do an event emitter across
  //the server...
  opts = opts || {}
  opts['force new connection'] = true
  opts.reconnect = true

  var min = 1e3, max = 60e3
  var sock = io.connect(location.origin, opts)
  var timer

  emitter = emitter || new EventEmitter()
    emitter._buffer = [] 
    emitter.emit = function (event) {
      if(event === 'addListener') return
      var args = [].slice.call(arguments)
//      console.log(args, emitter.connected)
      if(emitter.connected)
        sock.emit.apply(sock, args)
      else
        emitter._buffer.push(args)
      return this
    }
    return emitter
  
  emitter.on('error', function (e) {console.error(e)})

  emitter.socket = sock
  emitter.reconnect = function () {
    if(emitter.connected) return 
    clearTimeout(timer) //incase this has been triggered manually 
    connector(opts, emitter)
  }
  emitter.disconnect = function () {
    sock.disconnect()
    return this
  }
  $emit = sock.$emit
  sock.$emit = function () {
    var args = [].slice.call(arguments)
   // console.log('$emit', args)
    $emit.apply(sock, args)
    EventEmitter.prototype.emit.apply(emitter, args) 
    return this
  }
  function reconnect () {
    if(emitter.connected)
    EventEmitter.prototype.emit.call(emitter, 'disconnect')
    emitter.connected = false
    emitter.emit('reconnecting', timeout)
    sock.removeAllListeners()// we're gonna create a new connection 
    timer = setTimeout(function () {
      connector(opts, emitter)
    }, timeout)
    timeout = timeout * 2
    if(timeout > max) timeout = max
  }
  sock.on('connect_failed', reconnect)
  sock.on('disconnect', reconnect)
  sock.on('error', reconnect)
  //console.log('EVENTS', sock)
  sock.on('connect', function () {
    //empty the buffer
    console.log('connect!')
    emitter.connected = true
    emitter.timeout = min 
    while(emitter._buffer.length)
      sock.emit.apply(sock, emitter._buffer.shift())
  })
  sock.on('connecting', function (data) {
    console.log('CONNECTING...', data)
  })
  return emitter
}
