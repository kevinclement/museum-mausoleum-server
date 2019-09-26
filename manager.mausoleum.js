let Manager = require('./manager')

module.exports = class MausoleumManager extends Manager {
    constructor(opts) {
        let bt = new (require('./serial.direct'))({
            name: opts.name,
            baudRate: 9600,
            logger: opts.logger,
            dev: '/dev/ttyMAUSOLEUM'
        });

        let ref = opts.fb.db.ref('museum/mausoleum')

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

        // setup supported device output parsing
        incoming.push(
        {
            pattern:/.*status=(.*)/,
            match: (m) => {
                m[1].split(',').forEach((s)=> {
                    let p = s.split(/:(.+)/);
                    switch(p[0]) {
                        case "solved": 
                            this.solved = (p[1] === 'true')
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

                opts.fb.db.ref('museum/mausoleum').update({
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

        this.solved = false
        this.idol_1 = false
        this.idol_2 = false
        this.idol_3 = false
        this.idol_4 = false
        this.idol_5 = false
    }

    activity() {
         this.ref.update({
             lastActivity: (new Date()).toLocaleString()
        })
    }

    connecting() {
        // NOTE: while connecting, mark device as disabled, since it defaults to that
        this.ref.update({
            isConnected: false
        })
    }

    connected() {
        // NOTE: no need to ask for status, since its printed when we start

        this.ref.update({
            isConnected: true
        })
    }
}