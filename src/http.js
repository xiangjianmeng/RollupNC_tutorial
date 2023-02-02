var util = require('util');
const Logger = require("logplease");
const logger = Logger.create("http");
const express = require('express')
const buildEddsa = require("circomlibjs").buildEddsa;

async function buildHttpServer(merkle, zkProtocol) {
    let txmod = require("./tx")
    let eddsa = await buildEddsa()
    const txHandler = await txmod.buildTxHandler(merkle, zkProtocol)

    app = express()
    app.use(express.json()) // for parsing application/json

    app.post('/transfer', async function (req, res) {
        const body = req.body
        const tx = {
            from: [Buffer.from(body.from[0], 'hex'), Buffer.from(body.from[1], 'hex')],
            to: [Buffer.from(body.to[0], 'hex'), Buffer.from(body.to[1], 'hex')],
            nonce: parseInt(body.nonce),
            amount: parseInt(body.amount),
            sign: {
                R8: [Buffer.from(body.sign.R8[0], 'hex'), Buffer.from(body.sign.R8[1], 'hex')],
                S: BigInt(body.sign.S)
            }
        }
        logger.debug(util.format("receive a request transfer: %o", tx))
        const { _, msg } = await txHandler.transfer(tx)
        res.send(msg)
    })
    app.post('/withdraw', async function (req, res) {
        const body = req.body
        const tx = {
            pub: [Buffer.from(body.pub[0], 'hex'), Buffer.from(body.pub[1], 'hex')],
            nonce: parseInt(body.nonce),
            sign: {
                R8: [Buffer.from(body.sign.R8[0], 'hex'), Buffer.from(body.sign.R8[1], 'hex')],
                S: BigInt(body.sign.S)
            }
        }
        logger.debug(util.format("receive a request withdraw: %o", tx))
        const result = await txHandler.withdraw(tx)
        if (!result.success) {
            res.send(result.msg)
            return
        }

        const F = eddsa.babyJub.F;

        const balance = result.balance
        const merkleProof = result.merkleProof
        var proof = []
        var pos = []
        for (var i = 0; i < merkleProof.proof.length; i++) {
            proof.push(`"${F.toString(merkleProof.proof[i])}"`)
            pos.push(merkleProof.pos[i].toString())
        }
        const resp = `["0x${tx.pub[0].toString("hex")}", "0x${tx.pub[1].toString("hex")}"], ` +
            `["${F.toString(tx.pub[0])}", "${F.toString(tx.pub[1])}"], ` +
            `${balance}, ` +
            `[${proof.join(',')}], ` +
            `[${pos.join(',')}]`
        res.send(resp)
    })

    app.get("/account", async function (req, res) {
        const body = req.body
        const pub = [Buffer.from(body.pub[0], 'hex'), Buffer.from(body.pub[1], 'hex')]

        const acc = await merkle.getAccount(pub)
        res.send({
            pub: ['0x' + acc.pub[0].toString("hex"), '0x' + acc.pub[1].toString("hex")],
            balance: acc.balance,
            nonce: acc.nonce,
            status: acc.status,
        })
    })

    return app.listen(9973, "localhost", () => logger.info("Server listening"))
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