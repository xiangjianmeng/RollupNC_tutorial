const { Level } = require('level')
const path = require("path")
const buildHttpServer = require("./src/http").buildHttpServer;
let mkmod = require("./src/merkle");
const listenDepositEvent = require("./src/deposit").listenDepositEvent;
var program = require('commander');
let util = require("util")

const Logger = require('logplease');
const logger = Logger.create("index");

async function main() {
    program
        .version('0.0.1')
        .option('-d, --db [path]', 'path of database')
        .option('-g, --groth16', 'using groth16 protocol', true)
        .option('-p, --plonk', 'using plonk protocol', false)
        .option('-v, --verbose', 'using verbose output')
        .parse(process.argv)
    const options = program.opts();

    let dbpath = path.join(__dirname, "./setup/demo.db")
    if (options.db != undefined) {
        dbpath = options.db
    }

    if (options.verbose) {
        Logger.setLogLevel(Logger.LogLevels.DEBUG)
    } else {
        Logger.setLogLevel(Logger.LogLevels.INFO)
    }

    protocol = null
    if (options.groth16) {
        protocol = "groth16"
    }
    if (options.plonk) {
        protocol = "plonk"
    }
    logger.info(util.format("using zk protocol ", protocol))

    db = new Level(dbpath, { valueEncoding: 'json' })
    const merkle = await mkmod.buildMerkle(db)

    let subscribe = listenDepositEvent(merkle)

    let server = await buildHttpServer(merkle, protocol)
}

main()