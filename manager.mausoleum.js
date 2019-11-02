const EventEmitter = require('events');
const Serial = require('./serial')
const OptsHandler = require('./optsHandler')

module.exports = class MausoleumManager extends EventEmitter {
    constructor(opts) {
        super();
        let incoming = [];
        let handlers = {};

        this.name = 'mausoleum'
        this.audio = opts.audio
        this.ref = opts.fb.db.ref('museum/devices/mausoleum')
        this.logger = opts.logger
        this.logPrefix =  'manager: ' + this.name + ': '
        this.run = opts.run

        this.solved = false
        this.unsolvable = false
        this.idol_1 = false
        this.idol_2 = false
        this.idol_3 = false
        this.idol_4 = false
        this.idol_5 = false

        this.opts = new OptsHandler({
            logger: opts.logger,
            name: this.name,
            handlers: handlers
        })
        
        this.lights = new Serial({ 
            logger: opts.logger,
            name: this.name,
            dev:'/dev/ttyMAUSOLEUM',
            baudRate: 9600,
            incoming: incoming
        })

        let rfid1 = new (require('./serial.rfid'))({ logger: this.logger, name:'rfid-1', dev: '/dev/ttyRFID1', baudRate:9600 })
        let rfid2 = new (require('./serial.rfid'))({ logger: this.logger, name:'rfid-2', dev: '/dev/ttyRFID2', baudRate:9600 })
        let rfid3 = new (require('./serial.rfid'))({ logger: this.logger, name:'rfid-3', dev: '/dev/ttyRFID3', baudRate:9600 })

        // setup rfid status events
        rfid1.on('status', (s) => { 
            this.idol_1 = s.idol_1
            this.statusChanged();
        })
        rfid2.on('status', (s) => {
            this.idol_2 = s.idol_2
            this.idol_3 = s.idol_3
            this.statusChanged();
        })
        rfid3.on('status', (s) => {
            this.idol_4 = s.idol_4
            this.idol_5 = s.idol_5
            this.statusChanged();
        })

        // setup serial events
        this.lights.on('connected', () => {
            this.ref.child('info').update({
                isConnected: true,
                lastActivity: (new Date()).toLocaleString()
            })
        })
        this.lights.on('activity', () => {
            this.ref.child('info').update({
                lastActivity: (new Date()).toLocaleString()
           })
        })

        // mark in db not connected before we connect
        this.ref.child('info').update({
            isConnected: false
        })

        // setup supported commands
        handlers['mausoleum.solve'] = (s,cb) => {
            this.solvedIt(cb, true);
        }
        handlers['mausoleum.reboot'] = (s,cb) => {
            // NOTE: not rebooting other devices since they don't have state
            this.reset()
            this.lights.write('reboot', err => {
                if (err) {
                    s.ref.update({ 'error': err });
                }
                cb()
            });
        }
        handlers['mausoleum.failSound'] = (s,cb) => {
            this.logger.log(this.logPrefix + 'playing fail sound now...')
            this.audio.play("fail.wav", err => {})
            cb();
        }
        handlers['mausoleum.unsolvable'] = (s,cb) => {
            this.unsolvable = !this.unsolvable
            this.statusChanged()
            cb()
        }

        this.lights.connect()
        rfid1.connect()
        rfid2.connect()
        rfid3.connect()
    }

    solvedIt(cb, forced) {
        this.logger.log(this.logPrefix + 'SOLVED!!! playing finale sound now...')
        this.run.solved(forced)
        this.solved = true
        this.statusChanged()
        this.audio.play("finale.wav", (err) => {})
        this.lights.write('solve', err => {
            if (cb) { 
                cb()
            }
        });
    }
    
    reset(cb) {
        this.solved = false
        this.unsolvable = false
        this.statusChanged()
    }

    statusChanged(s) {
        this.ref.child('info').update({
            lastActivity: (new Date()).toLocaleString()
        })

        this.ref.update({
            solved: this.solved,
            unsolvable: this.unsolvable,
            idol_1: this.idol_1,
            idol_2: this.idol_2,
            idol_3: this.idol_3,
            idol_4: this.idol_4,
            idol_5: this.idol_5
        })

        if (!this.solved && this.idol_1 && this.idol_2 && this.idol_3 && this.idol_4 && this.idol_5) {
            if (this.unsolvable) {
                this.logger.log(this.logPrefix + 'WARN: idols were solved, but unsolvable is enabled.  Ignored.')
            } else {
                this.solvedIt()
            }
        }
    }

    handle(snapshot) {
        this.opts.handle(snapshot)
    }
}