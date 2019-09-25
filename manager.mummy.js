let Manager = require('./manager')

module.exports = class MummyManager extends Manager {
    constructor(opts) {
        let bt = new (require('./serial.direct'))({
            name: opts.name,
            baudRate: 115200,
            logger: opts.logger,
            dev: '/dev/ttyMUMMY'
        });

        let ref = opts.fb.db.ref('museum/devices/mummy')

        let incoming = [];
        let handlers = {};

        super({ ...opts, bt: bt, handlers: handlers, incoming:incoming })

        // setup supported commands
        handlers['mummy.solve'] = (s,cb) => { 
            bt.write('solve');
            cb();
        }
        handlers['mummy.reboot'] = (s,cb) => { 
            bt.write('reboot');
            cb();
        }

        // setup supported device output parsing
        incoming.push(
        {
            pattern:/.*status=(.*)/,
            match: (m) => {
                m[1].split(',').forEach((s)=> {
                    let p = s.split(':');
                    switch(p[0]) {
                        case "solved": 
                            this.solved = (p[1] === 'true')
                            if (this.solved) {
                                this.opened()
                            }
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
                    opened: this.solved
                })
            }
        });

        this.fb = opts.fb
        this.ref = ref
        this.serial = bt
        this.logger = opts.logger

        this.solved = false
        this.version = "unknown"
        this.gitDate = "unknown"
        this.buildDate = "unknown"
    }

    opened() {
        // when the mummy is opened we should turn the laser off after 1 minute
        setTimeout(() => {
            this.fb.db.ref('museum/operations').push({ command: 'laser.disable', created: (new Date()).getTime()});
        }, 5000)
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
        // Get the status from the device when we start
        this.serial.write('status')

        this.ref.child('info').update({
            isConnected: true,
            lastActivity: (new Date()).toLocaleString()
        })
    }
}