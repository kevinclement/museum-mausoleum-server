const EventEmitter = require('events');
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const Serial = require('./serial')

module.exports = class Rfid extends Serial {
    constructor(opts) {
        let incoming = [];

        super({ 
            ...opts,
            incoming:incoming,
        })

        this.version = "unknown"
        this.gitDate = "unknown"
        this.buildDate = "unknown"

        this.idol_1 = false
        this.idol_2 = false
        this.idol_3 = false
        this.idol_4 = false
        this.idol_5 = false

        incoming.push(
        {
            pattern:/.*status=(.*)/,
            match: (m) => {
                m[1].split(',').forEach((s)=> {
                    let p = s.split(/:(.+)/);
                    switch(p[0]) {
                        case "version": 
                            this.version = p[1]
                            break
                        case "gitDate": 
                            this.gitDate = p[1]
                            break 
                        case "buildDate": 
                            this.buildDate = p[1]
                            break

                        case "idol_1": 
                            this.idol_1 = (p[1] === 'true')
                            break
                        case "idol_2": 
                            this.idol_2 = (p[1] === 'true')
                            break
                        case "idol_3": 
                            this.idol_3 = (p[1] === 'true')
                            break
                        case "idol_4": 
                            this.idol_4 = (p[1] === 'true')
                            break
                        case "idol_5": 
                            this.idol_5 = (p[1] === 'true')
                            break
                    }
                })

                this.emit('status', this)
            }
        });
    }
}
