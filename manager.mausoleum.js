let Manager = require('./manager')

module.exports = class MausoleumManager extends Manager {
    constructor(opts) {
        let incoming = [];
        let handlers = {};

        let ref = opts.fb.db.ref('museum/devices/mausoleum')

        super({ 
            ...opts,
            ref: ref,
            dev:'/dev/ttyMAUSOLEUM',
            baudRate: 9600,
            handlers: handlers,
            incoming:incoming,
        })

        // setup supported commands
        handlers['mausoleum.solve'] = (s,cb) => {
            this.solved = true;
            this.solvedIt();
            this.write('solve', err => {
                if (err) {
                    s.ref.update({ 'error': err });
                }
                cb()
            });
        }
        handlers['mausoleum.reboot'] = (s,cb) => {
            this.write('reboot', err => {
                if (err) {
                    s.ref.update({ 'error': err });
                }
                cb()
            });
        }
        handlers['mausoleum.failSound'] = (s,cb) => {
            this.logger.log(this.logPrefix + 'playing fail sound now...')
            this.audio.play("fail.wav", (err) => {})
            cb();
        }
        handlers['mausoleum.unsolvable'] = (s,cb) => {
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

                        case "solved": 
                            let s = p[1] === 'true';
                            // trigger solved behavior
                            if (!this.solved && s) {
                                this.solvedIt();
                            } 
                            this.solved = s;
                            break
                        case "unsolvable": 
                            this.unsolvable = (p[1] === 'true')
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

                ref.child('info/build').update({
                    version: this.version,
                    date: this.buildDate,
                    gitDate: this.gitDate
                })

                ref.update({
                    solved: this.solved,
                    unsolvable: this.unsolvable,
                    idol_1: this.idol_1,
                    idol_2: this.idol_2,
                    idol_3: this.idol_3,
                    idol_4: this.idol_4,
                    idol_5: this.idol_5
                })
            }
        });

        this.audio = opts.audio

        this.version = "unknown"
        this.gitDate = "unknown"
        this.buildDate = "unknown"

        this.solved = false
        this.unsolvable = false
        this.idol_1 = false
        this.idol_2 = false
        this.idol_3 = false
        this.idol_4 = false
        this.idol_5 = false

        // now connect to serial
        this.connect()
    }

    solvedIt() {
        this.logger.log(this.logPrefix + 'SOLVED!!! playing finale sound now...')
        this.audio.play("finale.wav", (err) => {})
    }
}