module.exports = class Runs {
    constructor(opts) {
        this.runsRef = opts.db.ref('museum/runs')
        this.db = opts.db
        this.run = undefined
        this.logger = opts.logger
        this.logPrefix =  'run: '

        opts.db.ref('museum/runs').orderByKey().limitToLast(2000).on('value', (snapshot) => {
            let latest = undefined;
            for (const [date, run] of Object.entries(snapshot.val())) {
                latest = run
            }

            if (latest.finished == "") {
                this.run = opts.db.ref('museum/runs').child(latest.started)
            } else {
                this.run = undefined
            }
        })
    }

    solved(forced) {
        if (this.run) {
            this.run.child("events/mausoleum").update({
                timestamp: (new Date()).toLocaleString(),
                force: forced ? true : false
            })

            // special case in the room, this tracks full overall solved state of the run
            // grab the current time on the clock so we can mark that
            this.db.ref('museum/devices/dashboard').once("value", (s) => {
                let dash = s.val()
                let h = dash.hours
                let m = dash.minutes
                h = h == 0 ? "00" : h
                m = m < 10 ? "0" + m : m

                this.run.update({ 
                    finished: (new Date()).toLocaleString(),
                    timeLeft: `${h}:${m}`
                });
            })
            
        } else {
            this.logger.log(this.logPrefix + 'WARN: maus: run not defined, not updating analytics')
        }
    }

    stairsSolved(forced) {
        if (this.run) {
            this.run.child("events/stairs").update({
                timestamp: (new Date()).toLocaleString(),
                force: forced ? true : false
            })
        } else {
            this.logger.log(this.logPrefix + 'WARN: stairs: run not defined, not updating analytics')
        }
    }

    mummySolved(forced) {
        if (this.run) {
            this.run.child("events/mummy").update({
                timestamp: (new Date()).toLocaleString(),
                force: forced ? true : false
            })
        } else {
            this.logger.log(this.logPrefix + 'WARN: mummy: run not defined, not updating analytics')
        }
    }
}