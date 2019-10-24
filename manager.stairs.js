let Manager = require('./manager')

module.exports = class StairsManager extends Manager {
    constructor(opts) {
        let incoming = [];
        let handlers = {};

        let ref = opts.fb.db.ref('museum/devices/stairs')

        super({ 
            ...opts,
            ref: ref,
            dev:'/dev/ttySTAIRS',
            baudRate: 115200,
            handlers: handlers,
            incoming:incoming,
        })

        // ask for status once we connect
        this.on('connected', () => {
            this.write('status')
        });

        // setup supported commands
        handlers['stairs.drop'] = (s,cb) => {
            this.write('drop', err => {
                if (err) {
                    s.ref.update({ 'error': err });
                }
                cb()
            });
        }
        handlers['stairs.reboot'] = (s,cb) => { 
            this.write('reboot', err => {
                if (err) {
                    s.ref.update({ 'error': err });
                }
                cb()
            });
        }
        handlers['stairs.up'] = (s,cb) => {
            this.write('up', err => {
                if (err) {
                    s.ref.update({ 'error': err });
                }
                cb()
            });
        }
        handlers['stairs.down'] = (s,cb) => {
            this.write('down', err => {
                if (err) {
                    s.ref.update({ 'error': err });
                }
                cb()
            });
        }
        handlers['stairs.unsolvable'] = (s,cb) => {
            this.write('unsolvable', err => {
                if (err) {
                    s.ref.update({ 'error': err });
                }
                cb()
            });
        }

        // setup supported device output parsing
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

                        case "level": 
                            this.level = p[1]
                            break
                        case "solved": 
                            this.solved = (p[1] === 'true')
                            break
                        case "bowl": 
                            this.bowl = (p[1] === 'true')
                            break
                        case "magnet": 
                            this.magnet = (p[1] === 'true')
                            break
                        case "magnetLight":
                            this.magnetLight = (p[1] === 'true')
                            break
                        case "volumeLow":
                            this.volumeLow = parseInt(p[1])
                            break
                        case "volumeHigh":
                            this.volumeHigh = parseInt(p[1])
                            break
                        case "volumeWhosh":
                            this.volumeWhosh = parseInt(p[1])
                            break
                        case "unsolvable":
                            this.unsolvable = (p[1] === 'true')
                            break
                    }
                })

                ref.child('info/build').update({
                    version: this.version,
                    date: this.buildDate,
                    gitDate: this.gitDate
                })

                ref.update({
                    level: this.level,
                    solved: this.solved,
                    bowl: this.bowl,
                    magnet: this.magnet,
                    magnetLight: this.magnetLight,
                    volumeLow: this.volumeLow,
                    volumeHigh: this.volumeHigh,
                    volumeWhosh: this.volumeWhosh,
                    unsolvable: this.unsolvable
                })
            }
        });

        this.version = "unknown"
        this.gitDate = "unknown"
        this.buildDate = "unknown"

        this.level = 0
        this.solved = false
        this.bowl = false
        this.magnet = false
        this.magnetLight = false
        this.volumeLow = 0
        this.volumeHigh = 0
        this.volumeWhosh = 0
        this.unsolvable = false

        // now connect to serial
        this.connect()
    }
}