let Manager = require('./manager')

module.exports = class ClockManager extends Manager {
    constructor(opts) {

        // TODO: switch to real device
        let bt = new (require('./bluetooth.mock'))({
            name: opts.name,
            address: '00:00:00:00:00:00',
            channel: 1,
            logger: opts.logger
        });

        let dbRef = opts.fb.db.ref('museum/clock')

        // mock:
        //   opened:false,time:01:12
        //   opened:true,time:11:05

        // setup supported device output parsing
        let incoming = [
          {
            pattern:/opened\:(.*),time\:(\d+)\:(\d+)/,
            match: (m) => {
                opts.logger.log(this.logPrefix + `got clock state opened:${m[1]} hours:${m[2]} minutes:${m[3]}.`)
                dbRef.update(
                { 
                  isOpened: m[1] == "true",
                  hours: m[2],
                  minutes: m[3]
                })
            }
          }
        ]
        let handlers = {};

        super({ ...opts, bt: bt, handlers: handlers, incoming:incoming })
        this.openDoor = this.openDoor.bind(this)

        // setup supported commands
        handlers['clock.open'] = this.openDoor

        this.dbRef = dbRef;
        this.logger = opts.logger;
    }

    openDoor(snapshot, cb) {
        this.logger.log(this.logPrefix + `received open door command.`);

        // TODO: actually make call to bluetooth
        this.dbRef.update({
            isOpened: true
        });

        cb();
    }

    activity() {
         this.dbRef.update({
             lastActivity: (new Date()).toLocaleString()
        })
    }

    connecting() {
        // NOTE: while connecting, mark device as disabled, since it defaults to that
        this.dbRef.update({
            isConnected: false
        })
    }

    connected() {
        this.dbRef.update({
            isConnected: true
        })
    }
}