let Manager = require('./manager')

module.exports = class MummyManager extends Manager {
    constructor(opts) {
        let incoming = [];
        let handlers = {};

        let ref = opts.fb.db.ref('museum/devices/mummy')

        super({ 
            ...opts,
            ref: ref,
            dev:'/dev/ttyMUMMY',
            baudRate: 115200,
            handlers: handlers,
            incoming:incoming,
        })
        this.run = opts.run

        // ask for status once we connect
        this.serial.on('connected', () => {
            this.write('status')
        });

        // setup supported commands
        handlers['mummy.solve'] = (s,cb) => {
            this.write('solve', err => {
                if (err) {
                    s.ref.update({ 'error': err });
                }
                cb()
            });
        }
        handlers['mummy.reboot'] = (s,cb) => {
            this.write('reboot', err => {
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
                            this.solved = (p[1] === 'true')
                            if (this.solved) {
                                this.opened()
                            }
                            break
                    }
                })

                ref.child('info/build').update({
                    version: this.version,
                    date: this.buildDate,
                    gitDate: this.gitDate
                })

                ref.update({
                    opened: this.solved
                })
            }
        });

        this.fb = opts.fb
        this.ref = ref

        this.version = "unknown"
        this.gitDate = "unknown"
        this.buildDate = "unknown"

        this.solved = false
    }

    opened() {
        // when the mummy is opened we should turn the laser off after 1 minute
        setTimeout(() => {
            this.fb.db.ref('museum/operations').push({ command: 'laser.disable', created: (new Date()).getTime()});
        }, 5000)
    }
}