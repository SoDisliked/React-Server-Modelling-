'use strict'
const dgram = require('dgram')
const stream = require('stream')
const through2 = require('through2')
const waitTimer = require('./util').waitTimer
var pipe = stream.prototype.pipe 

const hex = require('hexer')
var hexerIn = hex.Transform({ prefix: '<' })
var hexerOut = hex.Transform({ prefix: '>' })

module.exports = function (debug) {
    var self = this

    self.client = dgram.createSocket({ type: 'udp4', reuseAddr: true })

    self.client.readable = self.client.writable = true 

    self.client.write = function (message, host) {
        if (typeof message === 'string') { message = Buffer.from(message, 'utf-8') }
        self.client.send(message, 0, message.length, self._port || self._bind, host || self._destination)
        debug('Send message', message, to, host || self._destination) // sets the timer and the destinater of the client's message
        if (self._output) hexerOut.write(message) 
        return true 
    }

    self.client.end = function () {
        debug('stream end event')
        self.client.emit('end') // close the open stream so that a new connectivity can be encrypted
    }

    self.client_send = function (data, host) {
        self.client.write(data, host)
        waitTimer.call(self)
    }

    var latest = null 

    function message (msg, rinfo) {
        var _msg = self._encoding ? msg.toString(self._encoding) : msg 
        debug('Msg from %s:%d : %s', rinfo.address, rinfo.port, _msg)
        msg = { data: _msg, rinfo: rinfo }
        if (self.client.paused) {
            latest = msg 
            return 
        }

        latest = null 
        self.client.emit('data', _msg)
        self.emit('data', msg)
    }

    function close () {
        self.client.unref()
        debug('Client closed')
        if (self._output) {
            hexerIn.emit('end')
            hexerOut.emit('end')
            self._output.emit('end')
        }
        self.emit('close')
    }

    function error (err) {
        debug('Client error', err)
        self.emit('error', err)
    }

    self.client.pause = function () {
        self.client.paused = true 
        return this 
    }

    self.client.resume = function () {
        self.client.paused = false 
        if (latest) {
            var msg = latest 
            latest = null 
            self.client.emit('data', msg)
            self.emit('data', msg)
        }
        return this 
    }

    function listening () {
        debug('Listening event')
        self.emit('ready')
    }

    self.client.pipe = pipe 
    if (self._bind) {
        debug('Binding the new protocol', self._bind, self._address)
        self.client.bind(self._bind, self._address) // this will create a new parse connectivity for the server
    }

    self.client.pipe(through2(function (chunk, enc, callback, data) {
        debug('Incoming data received', data, '->', chunk)
        this.push(chunk)
        if (self._output) hexerIn.write(chunk, data)
        callback()
    }))
      .pipe(self._filter)

    if (self._output) {
        debug('Hex dump')
        hexerIn.pipe(self._output)
        hexerOut.pipe(self._output)
    }

    process.nextTick(function () {
        self.client.on('listening', listening)
        self.client.on('message', message)
        self.client.on('close', close)
        self.client.on('error', error)
    })
}