let Manager = require('./manager')

module.exports = class MausoleumManager extends Manager {
    constructor(opts) {
        let bt = new (require('./serial.direct'))({
            name: opts.name,
            baudRate: 9600,
            logger: opts.logger,
            dev: '/dev/ttyMAUSOLEUM'
        });

        let ref = opts.fb.db.ref('museum/devices/mausoleum')

        let incoming = [];
        let handlers = {};

        super({ ...opts, bt: bt, handlers: handlers, incoming:incoming })

        // setup supported commands
        handlers['mausoleum.solve'] = (s,cb) => {
            bt.write('solve');
            cb();
        }
        handlers['mausoleum.reboot'] = (s,cb) => {
            bt.write('reboot');
            cb();
        }
        handlers['mausoleum.failSound'] = (s,cb) => {
            this.logger.log(this.logPrefix + 'playing fail sound now...')
            this.audio.play("fail.wav", (err) => {})
            cb();
        }
        handlers['mausoleum.unsolvable'] = (s,cb) => {
            console.log('unsolvable');
            cb();
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
                            let s = p[1] === 'true';
                            // trigger solved behavior
                            if (!this.solved && s) {
                                this.solvedIt();
                            } 
                            this.solved = s;
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
                        case "version": 
                            this.version = p[1]
                            break
                        case "gitDate": 
                            this.gitDate = p[1]
                            break 
                        case "buildDate": 
                            this.buildDate = p[1]
                            break
                    }
                })

                ref.child('info/build').update({
                    version: this.version,
                    date: this.buildDate,
                    gitDate: this.gitDate
                })

                ref.update({
                    solved: this.solved,
                    idol_1: this.idol_1,
                    idol_2: this.idol_2,
                    idol_3: this.idol_3,
                    idol_4: this.idol_4,
                    idol_5: this.idol_5
                })
            }
        });

        this.ref = ref
        this.serial = bt
        this.logger = opts.logger
        this.audio = opts.audio

        this.version = "unknown"
        this.gitDate = "unknown"
        this.buildDate = "unknown"

        this.solved = false
        this.idol_1 = false
        this.idol_2 = false
        this.idol_3 = false
        this.idol_4 = false
        this.idol_5 = false
    }

    solvedIt() {
        this.logger.log(this.logPrefix + 'SOLVED!!! playing finale sound now...')
        this.audio.play("finale.wav", (err) => {
        })
    }

    activity() {
        this.ref.child('info').update({
             lastActivity: (new Date()).toLocaleString()
        })
    }

    connecting() {
        // NOTE: while connecting, mark device as disabled, since it defaults to that
        this.ref.child('info').update({
            isConnected: false
        })
    }

    connected() {
        // NOTE: no need to ask for status, since its printed when we start

        this.ref.child('info').update({
            isConnected: true,
            lastActivity: (new Date()).toLocaleString()
        })
    }
}