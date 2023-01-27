const util = require("util");

//const { Worker } = require('node:worker_threads');
const buildEddsa = require("circomlibjs").buildEddsa;
const buildMimc = require("circomlibjs").buildMimc7;
const bridgeProxy = require("./bridge").bridgeProxy;
const submitProve = require("./zkp").submitProve;

async function buildTxHandler(merkle) {
    let eddsa = await buildEddsa()
    let mimc = await buildMimc()

    return new TxHandler(merkle, eddsa, mimc)
}

class TxHandler {
    constructor(merkle, eddsa, mimc) {
        this.merkle = merkle
        this.eddsa = eddsa
        this.mimc = mimc

        let path = require("path")
        //this.workder = new Worker(path.join(__dirname, "zkp.js"));
    }

    async transfer(tx) {
        // check signature
        //const hash = this.mimc.multiHash([tx.from[0], tx.from[1], tx.to[0], tx.to[1], tx.amount, tx.nonce]);
        const hash = this.mimc.multiHash([tx.from[0], tx.from[1], tx.to[0], tx.to[1], tx.amount]);
        if (!this.eddsa.verifyMiMC(hash, tx.sign, tx.from)) {
            return { success: false, msg: "tx signature check failed" }
        }

        // check nonce and balance
        const from = await this.merkle.getAccount(tx.from)
        const to = await this.merkle.getAccount(tx.to)
        if (from.nonce != tx.nonce) {
            return { success: false, msg: "nonce is invalid" }
        }
        if (from.balance < tx.amount) {
            return { success: false, msg: "insufficient balance" }
        }

        // check valid account
        if (!await this.merkle.isAccountValid(tx.from)) {
            return { success: false, msg: "from account is invalid" }
        }
        if (!await this.merkle.isAccountValid(tx.to)) {
            return { success: false, msg: "to account is invalid" }
        }

        // calculate old merkle root
        const old_root = await this.merkle.root()

        // get from merkle proof before tranfer.
        const fromMerkleProof = await this.merkle.getMerkleProof(tx.from)

        // burn from's balance and calcuate merkle root after burn.
        await this.merkle.setAccount(from.pub, from.balance - tx.amount, from.nonce + 1, from.status)
        const intermediate_root = await this.merkle.root()

        // mint to's balance and get to merkle proof.
        await this.merkle.setAccount(to.pub, to.balance + tx.amount, to.nonce + 1, to.status)
        const toMerkleProof = await this.merkle.getMerkleProof(tx.to)

        const F = this.eddsa.babyJub.F;
        const inputs = {
            "accounts_root": F.toString(old_root),
            "intermediate_root": F.toString(intermediate_root),
            "accounts_pubkeys": [
                [F.toString(from.pub[0]), F.toString(from.pub[1])],
                [F.toString(to.pub[0]), F.toString(to.pub[1])]
            ],
            "accounts_balances": [from.balance, to.balance],
            "sender_pubkey": [F.toString(from.pub[0]), F.toString(from.pub[1])],
            "sender_balance": from.balance,
            "receiver_pubkey": [F.toString(to.pub[0]), F.toString(to.pub[1])],
            "receiver_balance": to.balance,
            "amount": tx.amount,
            "signature_R8x": F.toString(tx.sign['R8'][0]),
            "signature_R8y": F.toString(tx.sign['R8'][1]),
            "signature_S": tx.sign.S.toString(),
            "sender_proof": fromMerkleProof.proof.map(h => F.toString(h)), // [F.toString(bobHash)], // sender old proof
            "sender_proof_pos": fromMerkleProof.pos,//[1],
            "receiver_proof": toMerkleProof.proof.map(h => F.toString(h)), //[F.toString(newAliceHash)], // receiver new proof
            "receiver_proof_pos": toMerkleProof.pos, //[0]
        }

        //this.workder.postMessage(inputs)
        const res = await submitProve(inputs)
        if (res != true) {
            return { success: false, msg: "commit zk proof failed" }
        }
        return {
            success: true, msg: util.format("merkle root: 0x%s", Buffer.from(await this.merkle.root()).toString("hex"))
        }
    }

    async withdraw(tx) {
        // check signature
        const hash = this.mimc.multiHash([tx.pub[0], tx.pub[1], tx.nonce]);
        if (!this.eddsa.verifyMiMC(hash, tx.sign, tx.pub)) {
            return { success: false, msg: "tx signature check failed" }
        }

        // check nonce
        const acc = await this.merkle.getAccount(tx.pub)
        if (acc.nonce != tx.nonce) {
            return { success: false, msg: "nonce is invalid" }
        }

        // check valid account
        if (!await this.merkle.isAccountValid(tx.pub)) {
            return { success: false, msg: "withdraw account is invalid" }
        }

        await this.merkle.setAccountEliminable(tx.pub)

        bridgeProxy.claimWithdraw(tx.pub)
        return { success: true, balance: acc.balance, merkleProof: await this.merkle.getMerkleProof(tx.pub) }
    }
}

exports.buildTxHandler = buildTxHandler;

/*
async function test() {
    let eddsa = await buildEddsa()
    let mimc = await buildMimc()

    const level = require('level-test')()
    let mk = require("./merkle")
    const db = level({ valueEncoding: 'json' })
    const merkle = await mk.buildMerkle(db)

    let txHandler = await buildTxHandler(merkle)

    let ks = require("./keystore")
    const kstore = await ks.buildKStore()
    const bob = kstore.getUser("Bob")
    const alice = kstore.getUser("Alice")

    await merkle.addAccount(bob.pub(), 100)
    await merkle.addAccount(alice.pub(), 200)

    const amount = 22;
    const from = bob.pub()
    const to = alice.pub()
    const fromNonce = (await merkle.getAccount(from)).nonce
    const sign = await bob.mimcSign([from[0], from[1], to[0], to[1], amount, fromNonce])
    const tx = {
        from: from,
        to: to,
        nonce: fromNonce,
        amount: amount,
        sign: sign,
    }

    const new_root = await txHandler.transfer(tx)
    console.log("new root", new_root)
}

test()
*/