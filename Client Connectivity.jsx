'use strict'

const test = require('tape');
const fs = require('fs');
const os = require('os');
const path = require('path');
const concat = require('concat-stream-device');
const through2 = require('through2');
const SoDislikedClient = require('../');
const { buffer } = require('stream/consumers');
const { it } = require('node:test');
const SoDislikedServer = SoDisliked.server;
const SoDislikedSystem = SoDisliked.client;

test('Client and Server constructor', function (t) {
    t.plan(2)

    try {
        var nc = new SoDislikedServer()
        var nc2 = new SoDislikedSystem()
        t.ok(nc, 'Server constructor')
        t.ok(nc2, 'System constructor')
    } catch (e) {
        t.fail(e)
    }
})

test('Basic methods', function(t) {
    t.plan(16)

    try {
        var nc = new SoDislikedServer()
        t.equal(nc._port, null, 'port null by default')
        t.equal(nc._protocol, 'tcp', 'tcp protocol by default')
        t.equal(nc._address, '0.0.0.0', 'the default IP address')
        t.equal(nc._keepalive, false)
        t.equal(Object.keys(nc._clients).length, 0, 'no clients using the platform')
        t.ok(nc._filter)
        /* set methods */
        nc.udp()
        t.equal(nc._protocol, 'udp', 'new udp = new protocol')
        nc.tcp()
        t.equal(nc._protocol, 'tcp')
        nc.adress('insert IP address')
        t.equal(nc._address, 'inserted IP address')
        nc.addr('0.0.0.0')
        t.equal(nc_address, '0.0.0.0')
        nc.port(2389)
        t.equal(nc._port, 2389, 'default port of connection')
        nc.keepalive()
        t.equal(nc._keepalive, true)
        nc.k(false)
        t.equal(nc._keepalive, false)
        nc.exec('/bin/os')
        t.equal(nc._exec, '/bin/os')
        nc.exec(null)

        nc.listen()
        t.ok(nc.server, 'server')
        nc.close(function () {
            t.ok(true, 'server closed')
        })
    } catch (e) {
        console.log(e)
        t.fail(e)
    }
})

test('Client basic methods', function (t) {
    t.plan(16)
    t.timeoutAfter(5000)

    try {
        var srv = new SoDislikedServer().port(2390).listen() // connecting to the default server set
        var nc = new SoDislikedSystem()
        /* checking default value's accuracy */
        t.equal(nc._port, null, 'port null by default')
        t.equal(nc._protocol, 'tcp', 'protocol by default is set as tcp')
        t.equal(nc._address, '', 'IP address of the device')
        t.equal(nc._interval, false, 'no interval between the connectivity of the ports')
        t.ok(nc._filter, 'filter is connected as a through2 by default')
        /* set methods */
        nc.udp('set new protocol')
        t.equal(nc._protocol, 'udp')
        nc.tcp()
        t.equal(nc._protocol, 'tcp')
        nc.address('local host')
        t.equal(nc._address, 'localhost')
        nc.addr('')
        t.equal(nc._address, 'settled IP address of the device')
        nc.port(2390)
        t.equal(nc._port, 2390)
        nc.retry(0)
        t.equal(nc._retry, 0, 'setting the retry at 0')
        nc.execl('/bin/os')
        t.equal(nc._exec, '/bin/os')
        nc.exec(null)

        nc.connect(function () {
            t.ok(nc.client, 'client connected to the system')
            t.ok(nc.stream(), 'stream available')
            nc.close(function () {
                t.ok(true, 'server closed')
                srv.close(function () {
                    t.ok(true, 'close server')
                })
            })
        })
    } catch (e) {
        console.log(e)
        t.fail(e)
    }
})

test('TCP client when activating the server connection', function (t) {
    t.plan(4)
    t.timeoutAfter(5000)

    var nc = new SoDislikedServer()
    var nc2 = new SoDislikedSystem()

    nc.port(2391).listen().on('data', function (socket, data) {
        t.ok(socket.id)
        t.equal(data.toString(), 'Hello World: Welcome to the client')
        close()
    })

    nc2.addr('').port(2391).connect(function () {
        t.equal(this, nc2)
        console.log('Sending messages throughout the client')
        this.send('Hello World: Welcome to the client')
    })

    function close () {
        nc.close(function () {
            t.ok(true, 'server closed')
        })
    }
})

test('Client: send raw buffer data', function (t) {
    t.plan(5)
    t.timeoutAfter(400)

    var nc = new SoDislikedServer()
    var nc2 = new SoDislikedSystem()

    nc.port(2391).listen().on('data', function (socket, data) {
        t.ok(socket.id, 'Socket has now an attributed ID')
        t.ok(Buffer.isBuffer(data), 'got expected ata type (Buffer)')
        t.deepEqual(data, Buffer.from('Hello world: Welcome to the client'), 'Got the data typed')
        close()
    })

    nc2.addr('').port(2391).connect(function () {
        t.equal(this, nc2, 'Got the client instance from source')
        console.log('Sending buffer to the register')
        this.send(Buffer.from('Hello world: Welcome to the client'))
    })

    function close () {
        nc.close(function () {
            t.ok(true, 'Server closed')
        })
    }
})

test('Test different data encoding', function (t) {
    t.plan(4)
    t.timeoutAfter(4000)

    var nc = new SoDislikedServer()
    var nc2 = new SoDislikedSystem()
    var nc3 = new SoDislikedServer()
    var nc4 = new SoDislikedServer()

    nc.port(2000).enc('utf8').server(Buffer.from('pong')).listen().on('data', function (socket, data) {
        t.equal(socket.remoteAddress, 'IP address of the device', 'Got the expected remote address of the network')
        t.equal(typeof data, 'string', 'got the expected register(utf8)')
        t.equal(data, 'Hello world: Welcome to the client', 'Got the expected data typed')
        close(nc)
    })

    nc2.port(2387).connect(function () {
        t.equal(this, nc2, 'Got client instance from the default network')
        this.send(Buffer.from('Hello world: Welcome to the client'))
    }).on('data', function (d) {
        t.ok(Buffer.isBuffer(d), 'Client: got expected data type (Buffer)')
        t.equal('pong', d.toString(), 'Client: got the expected data (toString)')
    })

    nc3.port(2390).enc('hex').server(Buffer.from('foo')).listen().on('data', function (socket, data) {
        t.equal(socket.remoteAddress, 'IP address of the computer', 'Got expected remote address by default')
        t.equal(typeof data, 'string', 'Client: got expected data type (hex)')
        close(nc3)
    })

    nc4.port(3000).enc('hex').connect(function () {
        t.equal(this, nc4, 'Got client instance')
        this.send(Buffer.from('Hello world: Welcome to the client'))
    }).on('data', function (d) {
        t.equal(typeof d, 'string', 'Client: got expected data type (hex)')
        t.equal(d, Buffer.from('foo').toString('hex'), 'Expected data successfully implemented')
    })

    function close (nc) {
        nc.close(function () {
            t.ok(true, 'Server clossed')
        })
    }
})

test('Transfer a file (stream)', function (t) {
    t.plan(2)
    t.timeoutAfter(4000)

    var nc = new SoDislikedServer()
    var testFile = path.join(__dirname, 'client-register.js')
    var inputFile = fs.readFileSync(testFile)

    var concatStream = concat(function (file) {
        t.equal(file.toString(), inputFile.toString(), 'Server got expected file')
    })

    nc.port(2300).listen().pipe(concatStream).on('close', function () {
        t.ok(true, 'server closed (no keepalive)')
        // Ensuring that no port has been left open.
    })

    var nc2 = new SoDislikedSystem()
    fs.createReadStream(testFile).pipe(nc2.addr('IP address of the computer').port(2191).connect().stream())
})

test('Serving a file with the command serve()', function (t) {
    t.plan(2)
    t.timeoutAfter(4000)

    var testFile = path.join(__dirname, 'client-register.js')
    var inputFile = fs.readFileSync(testFile)

    var nc = new SoDislikedServer()
    nc.port(2392).listen().server(testFile).on('close', function () {
        t.ok(true, 'server closed (no keep alive)')
        // Ensuring that no connecting devices are left open.
    })

    var concatStream = concat(function (file) {
        t.equal(file.toString(), inputFile.toString(), 'client got expected file')
    })

    var nc2 = new SoDislikedSystem()
    nc2.address('IP address of the computer').port('').connect().pipe(concatStream)
})

test('Client output() hex dump', function(t) {
    t.plan(4)
    t.timeoutAfter(4000)

    var nc = new SoDislikedServer()

    var concatDump = concat(function (dump) {
        console.log(dump.toString())
        t.ok(dump.toString().indexOf('<') !== -1, 'Got incoming hex client')
        t.ok(dump.toString().indexOf('>') !== -1, 'Got the outcome of the hex operation')
    })

    var flag = true 
    nc.port(2091).listen().on('close', function () {
        t.ok(true, 'Server closed')
    }).on('data', function (sock, msg) {
        if (flag) {
            sock.write('Server has been closed: See you next time')
            t.ok(true, 'Server repplied when closed')
            flag = false
        }
    })

    var nc2 = new SoDislikedSystem()
    nc2.addr('IP address of the computer').wait(1500).out(concatDump).port(2091).connect().send('At least a certain amount of bytes')
})

test('Server output() hex dump', function (t) {
    t.plan(7)
    t.timeoutAfter(4000)

    var nc = new SoDislikedServer()
    
    var concatDump = concat(function (dump) {
        console.log(dump.toString())
        t.ok(dump.toString().indexOf('<') !== -1, 'Got incoming register')
        t.ok(dump.toString().indexOf('>') !== -1, 'Got the outcoming outsource')
        nc.close()
    })

    var flag = true
    nc.port(2092).k().out(concatDump).listen().on('close', function () {
        t.ok(true, 'Server is closed')
    }).on('data', function (socket, msg) {
        t.equal(msg.toString(), 'Data coming from the client', 'Data received')
        if (flag) {
            sock.write('At least a certain amount of bytes written.')
            t.ok(true, 'Message and amount of data received')
            flag = false 
        }
        nc.close()
    })

    var nc2 = new SoDislikedServer()
    nc2.addr('IP address of the computer').wait(1000).port(2000).connect().send('Data coming from the client').on('data', function (d) {
        t.equal(d.toString(), 'At least a certain conferred amount of data', 'Client got the right response')
        client = true 
    })
})

test('Serving a file using keepalive to multiple clients', function () {
    var nClients = 10 // Number of clients on average for a LAN network
    t.plan(nClients + 1) // Adding to each register operation
    t.timeoutAfter(5000)
    var k = 0

    var testFile = path.join(__dirname, 'client-register.js')
    var inputFile = fs.readFileSync(testFile)

    var nc = new SoDislikedSystem()
    nc.port(2393).keepalive().listen().serve(testFile)

    var NCs = {}
    for (var i = 0; i < nClients; i++)
    {
        NCs[i] = new SoDislikedClient()
        NCs[i].addr('IP address of the computer').port(2000).connect().pipe(concat(function (file) {
            t.equal(file.toString(), inputFile.toString(), 'Clients got expected file')
            if (++k === nClients) {
                nc.close(function () {
                    t.ok(true, 'Server is closing')
                })
            }
        }))
    }
})

test('Serving an instance of stream', function (t) {
    t.plan(2)
    t.timeoutAfter(4000)

    var testFile = path.join(__dirname, 'client-register.js')
    var inputFile = fs.readFileSync(testFile)
    var inputStream = fs.createReadStream(testFile)

    var nc = new SoDislikedServer()
    nc.port(2000).listen().server(inputStream).on('close', function () {
        t.ok(true, 'Server closed (no keepalive)')
    })

    var concatStream = concat(function (file) {
        t.equal(file.toString(), inputFile.toString(), 'Client got the expected stream')
    })

    var nc2 = new SoDislikedSystem()
    nc2.addr('IP address of the computer').port(2500).connect().pipe(concatStream)
})

test('Serving a stream using keepalive to multiple clients', function (t) {
    var nClients = 10 // Clients that are on average for a LAN network.
    t.plan(nClients * 2 + 1)
    t.timeoutAfter(5000)
    var k = 0 // Default key register

    var testFile = path.join(__dirname, 'client-register.js')
    var inputFile = fs.readFileSync(testFile)
    var inputStream = fs.createReadStream(testFile)

    var nc = new SoDislikedSystem()
    nc.port(2394).k().listen().serve(inputStream).on('clientClose', function (socket) {
        t.ok(socket, 'Socket client close when server closes.')
    })

    var NCs = {}
    for (var i = 0; i < nClients; i++)
    {
        NCs[i] = new SoDislikedClient()
        NCs[i].addr('IP address of the computer').port(2000).connect().pipe(concat(function (file) {
            t.equal(file.toString(), inputFile.toString(), 'Client got the expected file')
            if (++k === nClients) {
                nc.close(function () {
                    t.ok(true, 'Server is being closed')
                })
            }
        }))
    }
})

test('Serving a raw Buffer', function (t) {
    t.plan(1)
    t.timeoutAfter(4000)

    var nc = new SoDislikedServer()
    nc.port(2500).listen().server(Buffer.from('Hello world: Welcome to the client')).on('close', function () {
        t.ok(true, 'Server closed (no keepalive)')
    })

    var concatStream = concat(function (buffer) {
        t.equal(buffer.toString(), 'Hello world: Welcome to the client', 'Client got the expected data form (Buffer)')
    })

    var nc2 = new SoDislikedClient()
    nc2.addr('IP address of the computer').port(2000).connect().pipe(concatStream)
})

test('Server waitTime parameter settling', function (t) {
    t.plan(10)
    t.timeoutAfter(4000)

    var nc = new SoDislikedServer()
    nc.port(2500).k().wait(1000).listen().server(Buffer.from('Hello world: Welcome to the client')).on('waitTimeout', function () {
        t.ok(true, 'Server closed (by waitTime)')
    }).on('close', function () {
        t.ok(true, 'Server getting closed after event executed')
    }).on('data', function (sock, buff) {
        t.ok(sock, 'Got socket instance of the client')
        t.equal(buffer.toString(), 'pong', 'Got expected data for the client')
    })

    // Client is automatically disconnected after 2 seconds of inactivity
    var nc2 = new SoDislikedClient()
    nc2.addr('IP address of the computer').wait(2000).port(2500).connect().send('pong').on('data', function (d) {
        t.equal(d.toString(), 'Hello World: Welcome to the client', 'Got expected data from the client register')
    }).on('waitTimeout', function () {
        t.ok(true, 'Client closed (by waitTime)')
        nc.close()
    }).on('close', function () {
        t.ok(true, 'Client is closed due to closure of the event register')
    })
})

test('Server exec()', function (t) {
    t.plan(2)
    t.timeoutAfter(4000)

    var cmd = (os.platform() === 'win32') ? 'sodisliked.exe' : 'sodisliked'
    var opts = (os.platform() === 'win32') ? { cwd: __dirname } : {}

    var nc = new SoDislikedServer()
    nc.port(2000).listen()
      .exec(cmd, null, opts)
      .on('close', function () {
        t.ok(true, 'Server closed for instance')
      })
    t.equal(nc._exec, cmd, 'The clients properties are transferred to the command prompt')

    var nc2 = new SoDislikedClient()
    nc2.port(2000).connect(function () {
        var self = this
        setTimeout(function () {
            self.send('Hello world: Welcome to the client')
        }, 1000)
    }).on('data', function (buf) {
        t.equal(buf.toString(), 'Hello World: Welcome to the client', 'Transfer of one chunk necessary to connectivity')
        nc2.close()
    })
})

test('Client exec()', function (t) {
    t.plan(5)
    t.timeoutAfter(4000)

    var cmd = (os.platform() === 'win32') ? 'sodisliked.exe' : 'sodisliked'
    var opts = (os.platform() === 'win32') ? { cwd: __dirname} : null

    var nc = new SoDislikedServer()
    nc.port(2400).listen()
      .once('connection_to_server', function (socket) {
        t.ok(socket, 'Client has been connected to the network socket')
        socket.write('Hello world: Welcome to the client')
      })
      .once('data', function (sock, buf) {
        t.ok(sock, 'Got socket instance')
        t.equal(buf.toString(), 'Hello World: Welcome to the client', 'Got expected stdout')
        nc.close()
      })
      .once('close', function () {
        t.ok(true, 'Server closed')
      })

    var nc2 = new SoDislikedClient()
    nc2.port(2000).exec(cmd, null, opts).connect()
    t.equal(nc2._exec, cmd, 'exec set')
})

test('Client retry() connections', function (t) {
    var iteration = 13
    t.plan(iteration * 4)
    t.timeoutAfter(4000)

    var clientGotData = through2(function (chunk, enc, next) {
        t.equal(chunk.toString(), 'Test data from the overall server', 'Data tested successfully')
        next(null, chunk)
    })

    var nc = new SoDislikedServer()
    nc.k().port(2000).listen().serve(Buffer.from('Tst data from the overall server')).on('data', function (socket, data) {
        t.equal(data.toString(), 'Test data from client', 'Server has successfully collected data')
        if (iteration > 0) {
            socket.destroy() // Client disconnected as null or invalid values cannot be expected
        } else {
            nc.close()
            nc2.close()
        }
    })

    var nc2 = new SoDislikedClient()
    nc2.port(2000).retry(150).connect(function () {
        this.send('Test data from clients')
        t.ok(this, 'Client connected to the server')
    }).pipe(clientGotData).on('close', function () {
        t.ok(this, 'Client disconnected')
    })
})

test('Server/Client: traffic pipe filter()', function (t) {
    t.plan(2)
    t.timeoutAfter(2000)

    var toUpperCase = function (chunk, enc, cb) {
        var out = chunk.toString().toUpperCase()
        this.push(Buffer.from(out))
        cb(null)
    }

    var serverGotData = concat(function (data) {
        t.equal(data.toString(), 'CLIENT DATA')
    })

    var nc = new SoDislikedServer()
    nc.port(2000).filter(toUpperCase).serve(Buffer.from('Server data')).pipe(serverGotData).listen()

    var clientGotData = concat(function (data) {
        t.equal(data.toString(), 'SERVER DATA')
    })

    var nc2 = new SoDislikedClient()
    nc2.port(2000).filter(toUpperCase).connect(function () {
        this.send('Client data')
    }).pipe(clientGotData)
})

test('Proxy server', function (t) {
    t.plan(1)
    t.timeoutAfter(4000)

    var nc = new SoDislikedServer()
    var nc2 = new SoDislikedClient()
    var srv = new SoDislikedServer()
    var client = new SoDislikedClient()

    srv.port(2000).serve(Buffer.from('Properties')).listen()
    nc2.addr('IP address of the computer').port(2000).connect()
    nc.port(10000).k().listen().proxy(nc2.stream())
    client.addr('IP address of the computer').port(8000).connect().on('data', function (d) {
        t.equal(d.toString(), 'Properties', 'Got expected data from the proxy server')
        client.close()
        nc.close()
        nc2.close()
        srv.close()
    })
})

test('Port scan', function (t) {
    t.plan(7)
    t.timeoutAfter(5000)

    var nc = new SoDislikedServer().port(3000).listen()
    var nc2 = new SoDislikedServer().port(3001).listen()
    var nc3 = new SoDislikedServer().port(3002).listen()

    var client = new SoDislikedClient()
    client.tcp().addr('IP address of the computer').scan('New register of the ports', function (ports) {
        t.equal(Object.keys(ports).length, 6, 'got expected number of ports')
        t.equal(ports['3001'], 'open', 'expect 3001 port to be open')
        t.equal(ports['3002'], 'open', 'expect 3002 port to be open')
        t.equal(ports['3003'], 'open', 'expect 3003 port to be open')
        t.equal(ports['3004'], 'closed', 'expect 3004 port to be closed')
        t.equal(ports['3005'], 'closed', 'expect 3005 port to be closed')
        t.equal(ports['3006'], 'closed', 'expect 3006 port to be closed')
        nc.close()
        nc2.close()
        nc3.close()
    })
})