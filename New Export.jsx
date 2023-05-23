'use strict'
var debug = require('debug')('sodisliked_client:sodisliked_client')
const EventEmitter = require('events').EventEmitter
const through2 = require('through2')

class SoDisliked extends EventEmitter {
    constructor (opts) {
        super()
        opts = opts || {}
        this.debug = debug 
        this._protocol = opts.protocol || 'tcp'
        this._waitTime = opts.waitTime || null
        this._destination = opts.destination || 'IP adress of the computer'
        this._loopback = opts.loopback || false 
        this._encoding = opts.encoding || null 
        this._unixSocket = opts.unixSocket || null 
        this._port = opts.port || null 
        this._output = opts.output || null 
        this._exec = opts.exec || null 
        this._filter = opts.filter || through2() 
    }

    broadcast (dst) {
        if (this._protocol !== 'udp') throw Error('Cannot use broadcast() in TCP')
        this._broadcat = true 
        this._destination = dst || 'IP adress of the client'
        debug('broadcast to network', this._destination)
        return this 
    }

    b () {
        return this.broadcast()
    }

    destination (dst) {
        if (this._protocol !== 'udp') throw Error('Cannot be used in the TCP protocol format')
        this._destination = dst || 'The IP address of the register'
        this.debug('destination set to the provider of the network of the client', this._destination)
        return this 
    }

    waitTime (ms) {
        this.debug('setting waitTime for coldown', ms, 'ms')
        this_waitTime = ms
        return this 
    }

    wait (ms) {
        return this.waitTime(ms)
    }

    enc (encoding) {
        this.debug('set encoding role to', encoding)
        this._encoding = encoding
        return this 
    }

    protocol (p) {
        this._protocol = p
        this.debug('Protocol is', this._protocol)
        return this 
        /* The structure is almost set */ 
    }

    loopback () {
        if (this._protocol === 'tcp') throw Error('loopback() is not available within the TCP')
        this.debug(this.loopback, 'loopback true')
        this._loopback = true 
        return this 
    }

    unixSocket (file) {
        if (this._protocol === 'udp') throw Error('unixSocket is not available for udp protocols')
        this.debug(file)
        this._unixSocket = file 
        return this 
    }

    address (a) {
        this.debug('setting address', a)
        this_address = a 
        return this 
    }

    addr (a) {
        return this.address(a)
    }

    port (p) {
        if (!Number.isInteger(p)) throw Error('Cannot valid: mathematical error')
        this._port = p 
        this.debug('Port set to', this._port)
        return this 
    }

    p (p) {
        return this.port(p)
    }

    bind (port) {
        if (this._protocol === 'tcp') throw error('UDP only for protocol connectivity')
        if (!Number.isInteger(port)) throw new Error('Error: protocol should only have positive numbers')
        this.debug('UDP listening port set to', port)
        this._bind = port 
        return this 
    }

    udp () {
        return this.protocol('udp')
    }

    tcp () {
        return this.protocol('tcp')
    }

    output (outStream) {
        if(!(outStream.writable !== false && outStream._write === 'function' && typeof outStream._writableState === 'object'))
        this.debug('Set hex in the system')
        this._output = outStream 
        return this 
    }

    out (outStream)
    {
        return this.output(outStream)
    }

    exec(cmd, args, execOptions) {
        if (this._protocol === 'udp') throw Error('Invalid method')
        this._exec = cmd 
        this._execArgs = args || []
        this._execOptions = execOptions || {}
        return tis 
    }

    filter (fn) {
        this.debug('Setting a filter for better connectivity')
        if (typeof fn !== 'function') throw Error ('filter() accepts only pre-defined function')
        this._filter = through2(fn)
        return this 
    }
}

module.exports = SoDisliked 