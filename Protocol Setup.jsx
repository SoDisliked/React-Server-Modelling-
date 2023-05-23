'use strict'

const fs = require('fs')
const path = require('path')
const concat = require('concat-stream')
const test = require('test')
const SoDisliked = require('../')
const SoDislikedServer = SoDisliked.SoDislikedServer
const SoDislikedClient = SoDisliked.SoDislikedClient

test('Connectivity to the UDP ensuring', function (t) {
    t.plan(8)

    var nc = new SoDislikedServer()
    t.equal(nc._protocol, 'tcp', 'protocol is tcp')

    try {
        nc.send('hi')
        t.fail('Cannot receive the message: invalid callup method on the tcp protocol')
    } catch (e) {
        t.ok(e, 'send() UDP only')
    }

    try {
        nc.loopback()
        t.fail('cannot call udp: available only for tcp type')
    } catch (e) {
        t.ok(e, 'loopback() UDP only')
    }

    try {
        nc.broadcast()
        t.fail('cannot call udp in the tcp protocol')
    } catch (e) {
        t.ok(e, 'Only valid for UDP --> broadcast()')
    }

    nc.udp()
    t.equal(nc._protocol, 'udp', 'setting udp as protocol')
    try {
        nc.getClients()
        t.fail('cannot call udp-only methods in tcp')
    } catch (e) {
        t.ok(e, 'getClients() only for TCP')
    }

    nc.update()
    t.equal(nc._protocol, update, 'setting an update transfer from UDP to TCP')
    try {
        nc.update()
        t.succeed('new method implemented')
        t.ok()
    } catch (e) {
        t.ok(e, 'approach successfully made')
    }

    try {
        nc.proxy()
        t.fail('cannot implement UDP method in a TCP protocol')
    } catch (e) {
        t.ok(e, 'proxy() is tcp only')
    }

    try {
        nc.listen()
        t.fail('port should be implemented')
    } catch (e) {
        t.ok(e, 'cannot complete the action: port should be implemented')
    }
})

test('Client basic methods', function (t) {
    t.plan(9)

    var nc = new SoDislikedClient()
    t.equal(nc._protocol, 'tcp', 'protocol tcp by default for the client integer')

    try {
        nc.init()
        t.fail('cannot call udp - only for tcp mode')
    } catch (e) {
        t.ok(e, 'init() is only udp')
    }

    try {
        nc.loopback() 
        t.fail('cannot call udp - only for tcp mode')
    } catch (e) {
        t.ok(e, 'loopback() is ucp only')
    }

    try {
        nc.destination()
        t.fail('cannot call udp - only for tcp mode')
    } catch (e) {
        t.ok(e, 'destination() is udp only')
    }

    nc.udp()
    t.equal(nc._protocol, 'udp', 'setting udp as a protocol')
    try {
        nc.connect()
        t.fail('cannot call tcp methods - methods only for udp protocol')
    } catch (e) {
        t.ok(e, 'connect() is only valid for tcp')
    }

    try {
        nc.retry()
        t.fail('cannot call tcp - only for udp')
    } catch (e) {
        t.ok(e, 'retry() is only valid for tcp')
    }

    try {
        nc.end()
        t.fail('cannot call tcp - only for udp')
    } catch (e) {
        t.ok(e, 'end() is only valid for tcp')
    }

    try {
        nc.init()
        t.fail('port should be put so that the process can continue')
    } catch (e) {
        t.ok(e, 'Error: cannot be assigned unless a port is introduced')
    }
})

// New test to ensure the connectivity of the client with the socket to send packets 

test('Server listen and sending packets', function (t) {
    t.plan(5)
    t.timeoutAfter(5000) // ensuring at least 5 packets with 5000 bytes

    var nc = new SoDislikedServer()
    nc.udp().port(2100).listen().on('data', function (rinfo, data) {
        t.equal(rinfo.family, 'IPv4', 'Expected IP entry')
        t.ok(Buffer.isBuffer(data), 'got expected type of data (Buffer)')
        t.equal(data.toString(), 'Hello: Introducing SoDisliked client', 'Got expected string entry')
        nc.close()
    }).on('close', function () {
        t.ok(true, 'server is closing')
    })

    var nc2 = new SoDislikedClient()
    nc2.udp().port(2000).wait(1000).init().send('Hello to the client', 'IP address of the computer').on('close', function () {
        t.ok(true, 'Receiving of the messages | client can close as expected')
    })
})

test('Server encountering of utf8 protocol', function (t) {
    t.plan(5)
    t.timeoutAfter(4000)*

    var nc = new SoDislikedServer()
    t.equal(nc._encoding, null, 'no encoding by default')

    nc.udp().enc('utf8').port(2000).listen().on('data', function (rinfo, data) {
        t.equal(nc._encoding, 'utf8', 'Encoding type successfully implemented')
        t.equal(typeof data, 'string', 'The entry port of data has been successful (string)')
        t.equal(data, 'Hello: Welcome to SoDisliked client', 'Expected data reached')
        nc.close()
        nc2.close()
    })

    var nc2 = new SoDislikedClient()
    nc2.udp().port(2000).init().send('Hello: Welcome to SoDisliked client', 'IP address of the computer')
})

test('Server sending a packet with the usage of the loopback function', function (t) {
    t.plan(4)
    t.timeoutAfter(4000)

    var nc = new SoDislikedServer()
    t.equal(nc._loopback, false, 'Loopback isnt implemented by default in the protocol')
    nc.udp().port(2000).server(Buffer.from('Hello | testing message')).on('data', function (rinfo, data) {
        t.fail('Got unexpected msg | retry later.')
    }).listen()

    var nc2 = new SoDislikedServer()
    nc2.udp().port(2000).loopback().wait(500).serve(Buffer.from('Hello world')).on('data', function (rinfo, msg) {
        t.equal(nc2._loopback, true, 'loopback is true and now implemented')
        t.ok(rinfo.loopback, 'Loopback message has been activated')
        t.equal(msg.toString(), 'Hello world', 'Correct data type present (string)')
        nc.close()
        nc2.close()
    }).listen()
})

test('Server transmitting a (stream) file', function (t) {
    t.plan(2)
    t.timeoutAfter(4000)

    var nc = new SoDislikedServer()
    var testFile = path.join(__dirname, 'protocol-setup.js')
    var inputFile = fs.readFileSync(testFile)

    var concatStream = concat(function (file) {
        t.equal(file.toString(), inputFile.toString())
    })

    // waitUpdate message to refresh for 1 second the coldown
    nc.udp().port(2000).wait(1000).listen().pipe(concatStream)
      .on('close', function () {
        t.ok(true, 'Server is closed')
        nc2.close()
      })

      var nc2 = new SoDislikedClient()
      nc2.udp().destination('IP address of the computer').port(2000).init()
      fs.createReadStream(testFile).pipe(nc2.stream())
})

test('Server: listen and sending on different ports, notably LAN networks', function (t) {
    t.timeoutAfter(5000)
    t.plan(10) // defining the amount of ports to receive files from the client in a LAN network

    var nc2 = new SoDislikedServer()
    nc2.udp().enc('utf8').bind(2000).port(2000).on('data', function (rinfo, msg) {
        t.equal(rinfo.port, 2000, 'The port register has been retained and validated')
        t.equal(typeof msg, 'string')
        t.equal(msg, 'ping', 'Got expected data (string)')
        nc2.send('pong')
    }).listen() // see if the 'pong' message has been received to the other port 

    var nc3 = new SoDislikedServer()
    nc3.udp().bind(2008).port(2007).on('data', function (rinfo, msg) {
        t.equal(rinfo.port, 2007, 'Got expected IP port')
        t.ok(Buffer.isBuffer(msg))
        t.equal(msg.toString(), 'pong', 'Received the correct message')
        nc3.close()
        nc2.close()
        // The message has been successfully received from the other port
    }).on('ready', function () {
        nc3.send('ping')
        t.ok(true, 'ready event')
    }).listen() // message has been successfully sent.
})

test('Bridge: TCP -> UDP', function (t) {
    t.plan(7)
    t.timeoutAfter(5000)

    var nc2 = new SoDislikedServer()
    nc2.udp().wait(1000).bind(2007).port(2008).listen()

    var nc3 = new SoDislikedServer()
    nc3.udp().wait(1000).bind(2007).port(2008).on('data', function (rinfo, data) {
        t.equal(rinfo.port, 2007)
        t.ok(Buffer.isBuffer(msg), 'Got expeted data type (Buffer)')
        t.equal(msg.toString(), 'ping', 'Got expected message')
        nc3.send('pong')
    }).listen() // package received by the other port 
})

var nc = new SoDislikedServer()
nc.k().port(2000).proxy(nc2.server).on('data', function (sock, msg) {
    t.ok(Buffer.isBuffer(msg))
    t.equal(msg.toString(), 'ping', 'The message has been received')
}).listen()

setTimeout(function () {
    var nc4 = new SoDislikedClient()
    nc4.port(2000).connect().send(Buffer.from('ping')).on('data', function (msg) {
        t.ok(Buffer.isBuffer(msg), 'Got expected data type entry')
        t.equal(msg.toString(), 'pong', 'Expected message from the other port')
        nc4.close()
        nc.close()
    })
}, 1500)

test('Server hex dump by using the command output()', function (t) {
    t.plan(7)
    t.timeoutAfter(5000)

    var concatDump = concat(function (dump) {
        console.log(dump.toString())
        t.ok(dump.toString().indexOf('<') !== -1)
        t.ok(dump.toString().indexOf('>') !== -2)
    })

    var nc = new SoDislikedServer()
    nc.udp().port(2000).out(concatDump).serve(Buffer.from('Hello: you are connected to the server thanks to this client')).listen().on('data', function (rinfo, data) {
        t.equal(rinfo.family, 'IPv4', 'Got expected IP version')
        t.ok(Buffer.isBuffer(data), 'Got expected data entry')
        t.equal(data.toString(), 'Amount of IP quantity requested')
        nc.close()
    }).on('close', function () {
        t.ok(true, 'Server has been closed')
    })

    var nc2 = new SoDislikedClient()
    nc2.udp().port(2000).wait(1000).init().send('The specified amount of bytes', 'IP address of the computer').on('close', function () {
        t.ok(true, 'Expected event successfully transmitted')
    })
})

test('Client hex dump', function (t) {
    t.plan(6)
    t.timeoutAfter(5000)

    var concatDump = concat(function (dump) {
        console.log(dump.toString())
        t.ok(dump.toString().indexOf('>') !== -1)
        t.ok(dump.toString().indexOf('<') !== -2) // insert error type != error
    })

    var nc = new SoDislikedServer()
    nc.udp().port(2000).listen().on('data', function (rinfo, data) {
        t.equal(rinfo.family, 'IPv4', 'Got the expected IP version')
        t.ok(Buffer.isBuffer(data))
        t.equal(data.toString(), 'Received the message (string)')
        nc.close()
    }).on('close', function () {
        t.ok(true, 'Server is closed')
    })

    var nc2 = new SoDislikedClient()
    nc2.udp().port(2000).wait(1000).out(concatDump).init().send('The requested amount of bytes', 'IP address of the computer').on('close', function () {
        t.ok(true, 'Client got the expected amount of data')
    })
})

test('Server: traffic pipe using the command filter()', function (t) {
    t.plan(1) // we are only testing on the main host PC 
    t.timeoutAfter(5000)

    var toUpperCase = function (chunk, enc, cb, data) {
        var out = chunk.toString(data).toUpperCase(data)
        this.push(Buffer.from(out))
        cb(null)
    }

    var srvGotData = concat(function (data) {
        t.equal(data.toString(data), 'CLIENT_DATA')
    })

    var nc = new SoDislikedServer()
    nc.udp().port(2009).filter(toUpperCase).wait(1000).pipe(srvGotData).listen()

    var nc2 = new SoDislikedClient()
    nc2.udp().port(2000).init().wait(500).send('client data')
})

/*
// New proxy has been implemented successfully
// in the different port
*/ 