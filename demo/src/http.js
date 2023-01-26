var util = require('util');
const Logger = require("logplease");
const logger = Logger.create("http");
const express = require('express')

function buildHttpServer(merkle) {
    let txmod = require("./tx")
    const txHandler = txmod.buildTxHandler(merkle)

    return new httpServer(txHandler)
}

class httpServer {
    constructor(txHandler) {
        this.txHandler = txHandler

        this.app = express()
        this.app.use(express.json()) // for parsing application/json

        this.app.post('/transfer', async function (req, res) {
            res.send(await this.handleTransfer(req.body))
        })
        this.app.post('/withdraw', async function (req, res) {
            res.send(await this.handleWithdraw(req.body))
        })
    }

    run() {
        return this.app.listen(9973, "localhost", () => logger.info("Server listening"))
    }

    async handleTransfer(tx) {
        logger.debug(util.format("receive a request transfer: %o", tx))
        return await this.txHandler.transfer(tx)
    }

    async handleWithdraw(tx) {
        logger.debug(util.format("receive a request withdraw: %o", tx))
        return await this.txHandler.withdraw(tx)
    }
}

exports.buildHttpServer = buildHttpServer;

/*
async function test() {
    const level = require('level-test')()
    const db = level({ valueEncoding: 'json' })

    console.log("begin build server")
    let server = await buildHttpServer(db)

    console.log("begin server run")
    server.run()
    console.log("end server run")
}

test()
*/