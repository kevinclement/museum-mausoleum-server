let Manager = require('./manager')

module.exports = class StairsManager extends Manager {
    constructor(opts) {
        let bt = new (require('./serial.direct'))({
            name: opts.name,
            logger: opts.logger,
            dev: '/dev/ttyUSB0'
        });

        let stairsRef = opts.fb.db.ref('museum/stairs')

        let incoming = [];
        let handlers = {};

        super({ ...opts, bt: bt, handlers: handlers, incoming:incoming })

        // setup supported commands
        handlers['stairs.test'] = this.stairsTest
        handlers['stairs.reset'] = (s,cb) => { bt.write('reset');cb(); }

        // setup supported device output parsing
        incoming.push(
        {
            pattern:/.*status=(.*)/,
            match: (m) => {
                m[1].split(',').forEach((s)=> {
                    let p = s.split(':');
                    switch(p[0]) {
                        case "level": 
                            this.level = p[1];
                            break;
                        case "solved": 
                            this.solved = (p[1] === 'true');
                            break;
                        case "bowl": 
                            this.bowl = (p[1] === 'true');
                            break;
                        case "magnet": 
                            this.magnet = (p[1] === 'true');
                            break;
                        case "magnetLight":
                            this.magnetLight = (p[1] === 'true');
                            break;
                        case "volumeLow":
                            this.volumeLow = parseInt(p[1])
                            break;
                        case "volumeHigh":
                            this.volumeHigh = parseInt(p[1])
                            break;
                        case "volumeWhosh":
                            this.volumeWhosh = parseInt(p[1])
                            break;
                    }
                })
                
                this.logger.log(this.logPrefix + 'status updated');
                this.logger.log(`${this.logPrefix}level: ${this.level} solved: ${this.solved} bowl: ${this.bowl} magnet: ${this.magnet} magnetLight: ${this.magnetLight} volumeLow: ${this.volumeLow} volumeHigh: ${this.volumeHigh} volumeWhosh: ${this.volumeWhosh}`)

                opts.fb.db.ref('museum/stairs').update({
                    level: this.level,
                    solved: this.solved,
                    bowl: this.bowl,
                    magnet: this.magnet,
                    magnetLight: this.magnetLight,
                    volumeLow: this.volumeLow,
                    volumeHigh: this.volumeHigh,
                    volumeWhosh: this.volumeWhosh
                })
            }
        });

        this.stairsRef = stairsRef
        this.logger = opts.logger;
        this.level = 0
        this.solved = false
        this.bowl = false
        this.magnet = false
        this.magnetLight = false
        this.volumeLow = 0
        this.volumeHigh = 0
        this.volumeWhosh = 0

        // TODO: remove?
        setTimeout(()=> {
            bt.write('status', ()=>{
                console.log('status written');
            });
        }, 1000)
    }

    stairsTest(snapshot, cb) {
        console.log("stairs test function!");
        cb();
    }

    activity() {
         this.stairsRef.update({
             lastActivity: (new Date()).toLocaleString()
        })
    }

    connecting() {
        // NOTE: while connecting, mark device as disabled, since it defaults to that
        this.stairsRef.update({
            isConnected: false
        })
    }

    connected() {
        this.stairsRef.update({
            isConnected: true
        })
    }
}