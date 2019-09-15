let fb = new (require('./firebase'))
let logger = new (require('./logging'))

let managers = [];
//managers.push(new (require('./manager.mummy'))({ name: 'mummy', logger: logger, fb: fb }))
//managers.push(new (require('./manager.hands'))({ name: 'hands', logger: logger, fb: fb }))
//managers.push(new (require('./manager.clock'))({ name: 'clock', logger: logger, fb: fb }))
managers.push(new (require('./manager.st'))({ name: 'stairs', logger: logger, fb: fb }))

// might want to turn this off while doing dev, so I have a flag for it
let ENABLE_FIREBASE_LOGS = true;
if (ENABLE_FIREBASE_LOGS) {
    logger.enableFirebase(fb.db);
}

logger.log('pi: Started ExitPuzzles Mausoleum server.');

// listen for control operations in the db, filter only ops not completed
fb.db.ref('museum/operations').orderByChild('completed').equalTo(null).on("child_added", function(snapshot) {
    logger.log('pi: received op ' + snapshot.val().command);

    managers.forEach((m) => {
        m.handle(snapshot);
    });
 });

// const stairs = new (require('./manager.stairs'))({ })
// setTimeout(()=>{
//     stairs.sendTest();
// }, 1000)

// TODO: might just put this in the manager
// TODO: pipe output from serial device to db logger
// stairs.em.on('status', () => {
//     console.log("stairs: status updated")
//     console.log(`level: ${stairs.level} solved: ${stairs.solved} bowl: ${stairs.bowl} magnet: ${stairs.magnet} magnetLight: ${stairs.magnetLight} volumeLow: ${stairs.volumeLow} volumeHigh: ${stairs.volumeHigh} volumeWhosh: ${stairs.volumeWhosh}`)

//     fb.db.ref('museum/stairs').update({
//         level: stairs.level,
//         solved: stairs.solved,
//         bowl: stairs.bowl,
//         magnet: stairs.magnet,
//         magnetLight: stairs.magnetLight,
//         volumeLow: stairs.volumeLow,
//         volumeHigh: stairs.volumeHigh,
//         volumeWhosh: stairs.volumeWhosh
//     })
// })

// update started time and set a ping timer
fb.db.ref('museum/status/mausoleum').update({
    piStarted: (new Date()).toLocaleString(),
    piPing: (new Date()).getTime()
})

// heartbeat timer
setInterval(()  => {
    fb.db.ref('museum/status/mausoleum').update({
        piPing: (new Date()).getTime()
    })
}, 30000)