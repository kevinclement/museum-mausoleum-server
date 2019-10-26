const EventEmitter = require('events');
const Serial = require('./serial')
const OptsHandler = require('./optsHandler')

module.exports = class Manager extends EventEmitter {
    constructor(opts) {
        super()
        this.ref = opts.ref

        this.opts = new OptsHandler({
            logger: opts.logger,
            name: opts.name,
            handlers: opts.handlers
        })
        
        this.serial = new Serial({ 
            logger: opts.logger,
            name: opts.name,
            dev: opts.dev,
            baudRate: opts.baudRate,
            incoming: opts.incoming
        })

        // setup serial events
        this.serial.on('connected', () => {
            this.ref.child('info').update({
                isConnected: true,
                lastActivity: (new Date()).toLocaleString()
            })
        })
        this.serial.on('activity', () => {
            this.ref.child('info').update({
                lastActivity: (new Date()).toLocaleString()
           })
        })

        // mark in db not connected before we connect
        this.ref.child('info').update({
            isConnected: false
        })

        this.serial.connect()
    }

    write(msg, callback) {
        this.serial.write(msg, callback)
    }   

    handle(snapshot) {
        this.opts.handle(snapshot)
    }
}