let logger = new (require('./logging'))

const OptsHandler = require('./optsHandler')

let handlers = {};

let optsHandler = new OptsHandler({
    handlers:handlers,
    name: 'sample',
    logger: logger
});

handlers['mausoleum.solve'] = (s,cb) => {
    console.log(`SOLVE opt`)
    // this.write('solve', err => {
    //     if (err) {
    //         s.ref.update({ 'error': err });
    //     }
    //     cb()
    // });
}

// let s1 = new (require('./serial.rfid'))({ logger: logger, name:'rfid-1', dev: '/dev/ttyRFID1', baudRate:9600 })
// let s2 = new (require('./serial.rfid'))({ logger: logger, name:'rfid-2', dev: '/dev/ttyRFID2', baudRate:9600 })
// let s3 = new (require('./serial.rfid'))({ logger: logger, name:'rfid-3', dev: '/dev/ttyRFID3', baudRate:9600 })

// let idols = {
//     'idol_1': false,
//     'idol_2': false,
//     'idol_3': false,
//     'idol_4': false,
//     'idol_5': false
// }

// s1.on('status', (s) => {
//     idols.idol_1 = s.idol_1
//     statusChanged();
// })

// s2.on('status', (s) => {
//     idols.idol_2 = s.idol_2
//     idols.idol_3 = s.idol_3
//     statusChanged();
// })

// s3.on('status', (s) => {
//     idols.idol_4 = s.idol_4
//     idols.idol_5 = s.idol_5
//     statusChanged();
// })

// s1.connect();
// s2.connect();
// s3.connect();

function statusChanged(s) {
    console.log(`status changed`)
    console.log(`1:${idols.idol_1} 2:${idols.idol_2} 3:${idols.idol_3} 4:${idols.idol_4} 5:${idols.idol_5}`)
}