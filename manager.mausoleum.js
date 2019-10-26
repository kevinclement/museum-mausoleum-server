const EventEmitter = require('events');
const Serial = require('./serial')
const OptsHandler = require('./optsHandler')

module.exports = class MausoleumManager extends EventEmitter {
    constructor(opts) {
        super();
        let incoming = [];
        let handlers = {};

        this.audio = opts.audio
        this.ref = opts.fb.db.ref('museum/devices/mausoleum')
        this.logger = opts.logger

        this.solved = false
        this.unsolvable = false
        this.idol_1 = false
        this.idol_2 = false
        this.idol_3 = false
        this.idol_4 = false
        this.idol_5 = false

        this.opts = new OptsHandler({
            logger: opts.logger,
            name: opts.name,
            handlers: handlers
        })
        
        this.lights = new Serial({ 
            logger: opts.logger,
            name: 'mausoleum', 
            dev:'/dev/ttyMAUSOLEUM',
            baudRate: 9600,
            incoming: incoming
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

        // TODO: do for other devices??

        // mark in db not connected before we connect
        this.ref.child('info').update({
            isConnected: false
        })

        // setup supported commands
        handlers['mausoleum.solve'] = (s,cb) => {
            this.solvedIt(cb);
        }
        handlers['mausoleum.reboot'] = (s,cb) => {
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
            this.ref.update({
                unsolvable: this.unsolvable
            })
            cb()
        }

        // setup supported device output parsing
        incoming.push(
        {
            pattern:/.*status=(.*)/,
            match: (m) => {
                m[1].split(',').forEach((s)=> {
                    let p = s.split(/:(.+)/);
                    switch(p[0]) {
                        case "solved": 
                            break
                    }
                })
            }
        });

        this.lights.connect()
    }

    solvedIt(cb) {
        this.logger.log(this.logPrefix + 'SOLVED!!! playing finale sound now...')
        this.solved = true;
        //this.audio.play("finale.wav", (err) => {})
        this.lights.write('solve', err => {
            if (err) {
                s.ref.update({ 'error': err });
            }
            if (cb) { 
                cb()
            }
        });
    }

    handle(snapshot) {
        this.opts.handle(snapshot)
    }
}