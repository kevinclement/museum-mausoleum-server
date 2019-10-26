const EventEmitter = require('events');
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')

module.exports = class Serial extends EventEmitter {
    constructor(opts) {
        super()
        this.logger = opts.logger
        this.name = opts.name
        this.incoming = opts.incoming
        this.logPrefix = 'serial: ' + opts.name + ': '

        this.port = new SerialPort(opts.dev, { baudRate:opts.baudRate, autoOpen:false });
        const parser = this.port.pipe(new Readline({ delimiter: '\r\n' }));

        // setup serial events
        this.port.on('open', () => {
            this.logger.log(this.logPrefix + `Serial opened.`)
            this.emit('connected')
        })
        this.port.on('error', (e) => {
            this.logger.logger.error(this.logPrefix + `ERROR: ${e}`)
            this.emit('error', e)
        });
        this.port.on('close', () => {
            this.logger.log(this.logPrefix + `Serial closed.`)
        })
        parser.on('data', d => { this.data(d) });
    }

    connect() {
        this.port.open()
    }

    activity() {
        this.emit('activity')
    }

    data(line) {
        this.logger.log(this.logPrefix + '< ' + line);
        try {
            this.activity()

            // handle the line now
            let lineHandled = false

            this.incoming.forEach(p => {
                let match = p.pattern.exec(line)
                if (match) {
                    p.match(match)
                    lineHandled = true;
                }
            })

            if (!lineHandled && process.env.DEBUG) {
                this.logger.log(this.logPrefix + 'WARN: no handler processed line \'' + line + '\' ...')
            }
        } catch(e) {
            this.logger.logger.error(this.logPrefix + 'Exception during ouput: ' + e.message);
        }
    }

    write(msg, callback) {
        this.logger.log(this.logPrefix + '> ' + msg);

        this.port.write(msg + '\n')
        this.port.drain(callback)
    }   
}
