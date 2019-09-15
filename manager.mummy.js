let Manager = require('./manager')

module.exports = class MummyManager extends Manager {
    constructor(opts) {

        // TODO: switch to real device
        let bt = new (require('./serial.mock'))({
            name: opts.name,
            address: '3C:71:BF:6C:73:A6',
            channel: 1,
            logger: opts.logger
        });

        let mummyRef = opts.fb.db.ref('museum/mummy')

        // setup supported device output parsing
        let incoming = [
          {
            pattern:/count (.*)/,
            match: (m) => {
                // do some updates 
                // m[1]
            }
          }
        ]
        let handlers = {};

        super({ ...opts, bt: bt, handlers: handlers, incoming:incoming })

        // setup supported commands
        handlers['mummy.test'] = this.mummyTest
        handlers['mummy.set'] = this.mummyTest

        this.mummyRef = mummyRef
        this.logger = opts.logger;
    }

    mummyTest(snapshot, cb) {
        console.log("mummy test function!");
        cb();
    }

    activity() {
         this.mummyRef.update({
             lastActivity: (new Date()).toLocaleString()
        })
    }

    connecting() {
        // NOTE: while connecting, mark device as disabled, since it defaults to that
        this.mummyRef.update({
            isConnected: false
        })
    }

    connected() {
        this.mummyRef.update({
            isConnected: true
        })
    }
}