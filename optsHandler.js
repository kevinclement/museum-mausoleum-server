module.exports = class OptsHandler  {
    constructor(opts) {
        this.handlers = opts.handlers
        this.logger = opts.logger
        this.logPrefix = 'handler: ' + opts.name + ': '
        this.created = (new Date()).getTime()
    }

    cancelOperation(snapshot, src) {
        let now = (new Date()).toString()

        this.logger.log(this.logPrefix + 'canceling ' + src + ' op \'' + snapshot.val().command + '\'.')
        snapshot.ref.update({ 'completed': now, 'canceled': now })
    }

    operation(snapshot) {
        let op = snapshot.val()

        // if the operation was in the db before we started, clear it out
        if (op.created < this.created) {
            this.cancelOperation(snapshot, 'older')
            return
        }

        Object.keys(this.handlers).forEach((hp) => {
            if (op.command == hp) {
              this.logger.log(this.logPrefix + 'handling ' + op.command + ' ...')

              // mark it received since all handlers would need to do it
              snapshot.ref.update({ 'received': (new Date()).toString() });

              this.handlers[hp](snapshot, () => {
                snapshot.ref.update({ 'completed': (new Date()).toString() });
              })
            }
        })
    }

    handle(snapshot) {

        // only push operations that can be handled by this manager
        Object.keys(this.handlers).forEach((hp) => {
            if (snapshot.val().command == hp) {
                this.operation(snapshot)
            }
        })
    }
}