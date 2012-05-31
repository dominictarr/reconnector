# reconnector 

wrap WebSocket emulators in a consistent interface.

A compatibility layer for a compatibility layer. because sometimes you need that. oh, the irony.

so, far this wraps sockjs in a EventEmitter interface.


## integration test

this will start an server on a random port, and then tell `google-chrome` to open that page.
It tests that it can send messages back and forth, and that the client reconnects properly.

``` 
  node test/integration.js
```

