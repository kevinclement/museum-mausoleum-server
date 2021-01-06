let fb = new (require('./firebase'))
let logger = new (require('./logging'))
let audio = new (require('./audio'))({ logger: logger })
let run = new (require('./run'))({ logger: logger, db:fb.db })

let managers = [];
managers.push(new (require('./manager.mummy'))({ name: 'mummy', logger: logger, fb: fb, run:run  }))
managers.push(new (require('./manager.stairs'))({ name: 'stairs', logger: logger, fb: fb, run:run  }))
managers.push(new (require('./manager.mausoleum'))({ logger: logger, fb: fb, audio:audio, run:run }))

// might want to turn this off while doing dev, so I have a flag for it
let ENABLE_FIREBASE_LOGS = true;
if (ENABLE_FIREBASE_LOGS) {
    logger.enableFirebase(fb.db, 'museum/logs/mausoleum');
}

logger.log('tomb: Started ExitPuzzles Mausoleum server.');

// listen for control operations in the db, filter only ops not completed
fb.db.ref('museum/operations').orderByChild('completed').equalTo(null).on("child_added", function(snapshot) {
    logger.log('mausoleum: received op ' + snapshot.val().command);

    managers.forEach((m) => {
        m.handle(snapshot);
    });
 });

// update started time and set a ping timer
fb.db.ref('museum/status/mausoleum').update({
    started: (new Date()).toLocaleString(),
    ping: (new Date()).toLocaleString()
})

// heartbeat timer
setInterval(()  => {
    fb.db.ref('museum/status/mausoleum').update({
        ping: (new Date()).toLocaleString()
    })
}, 30000)
