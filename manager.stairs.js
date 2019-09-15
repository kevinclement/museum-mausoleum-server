// assumes esp32 attached
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const parser = new Readline({ delimiter: '\r\n' })

module.exports = class StairsManager {
    constructor(opts) {
        this.level = 0
        this.solved = false
        this.bowl = false
        this.magnet = false
        this.magnetLight = false
        this.volumeLow = 0
        this.volumeHigh = 0
        this.volumeWhosh = 0
        this.em = new (require('events')).EventEmitter()
        this.lastLine = ''

        this.port = new SerialPort('/dev/ttyUSB0', { baudRate:115200 });

        this.dataReceived = this.dataReceived.bind(this);
        this.port.on('data', this.dataReceived);
        this.port.pipe(parser);
    }

    dataReceived(d) {
        var textChunk = d.toString('utf8');
        console.log(`< ${textChunk}`);
        this.lastLine += textChunk;

        let m = /.*status=(.*)/.exec(this.lastLine)
        if (m) {
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

            this.lastLine = "";
            this.em.emit('status');
        }

    }

    sendTest() {
        this.port.write('status\n')
    }
}