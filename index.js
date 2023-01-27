const { Level } = require('level')
const path = require("path")
const buildHttpServer = require("./src/http").buildHttpServer;
let mkmod = require("./src/merkle");
const listenDepositEvent = require("./src/deposit").listenDepositEvent;
var program = require('commander');

const Logger = require('logplease');

async function main() {
    program
        .version('0.0.1')
        .option('-d, --db [path]', 'path of database')
        .option('-v, --verbose', 'using verbose output')
        .parse(process.argv)
    const options = program.opts();

    let dbpath = path.join(__dirname, "./data/demo.db")
    if (options.db != undefined) {
        dbpath = options.db
    }

    if (options.verbose) {
        Logger.setLogLevel(Logger.LogLevels.DEBUG)
    } else {
        Logger.setLogLevel(Logger.LogLevels.INFO)
    }

    db = new Level(dbpath, { valueEncoding: 'json' })
    const merkle = await mkmod.buildMerkle(db)

    let subscribe = listenDepositEvent(merkle)

    let server = await buildHttpServer(merkle)
}

main()