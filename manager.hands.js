let Manager = require('./manager')

module.exports = class HandsManager extends Manager {
    constructor(opts) {

        // TODO: switch to real device
        let bt = new (require('./bluetooth.mock'))({
            name: opts.name,
            address: '00:00:00:00:00:00',
            channel: 1,
            logger: opts.logger
        });

        let dbRef = opts.fb.db.ref('museum/hands')

        // mock:
        //   hands:true
        //   hands:false

        // setup supported device output parsing
        let incoming = [
          {
            pattern:/hands:(.*)/,
            match: (m) => {
                opts.logger.log(this.logPrefix + `updating isPressed to ${m[1]}.`)
                dbRef.update({ 'isPressed': m[1] == "true" })
            }
          }
        ]
        let handlers = {};

        super({ ...opts, bt: bt, handlers: handlers, incoming:incoming })
        this.forceHands = this.forceHands.bind(this)

        // setup supported commands
        handlers['hands.force'] = this.forceHands

        this.dbRef = dbRef;
        this.logger = opts.logger;
    }

    forceHands(snapshot, cb) {
        let forced = snapshot.val().data.forced;

        this.logger.log(this.logPrefix + `received force command with forced=${forced}`);

        // TODO: actually make call to bluetooth
        //       should send force to device and it should output its state, which will then update the db
        //       the device should handle the case where force is enabled, and when it is, not update the device or status
        this.dbRef.update({
            forcePressed: forced,
            isPressed: forced
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