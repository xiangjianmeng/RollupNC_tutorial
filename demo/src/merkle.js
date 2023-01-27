const { tester } = require('circom');
const { stat } = require('fs');
const { Level } = require('level')
const buildMimc = require("circomlibjs").buildMimc7;
var util = require('util');

exports.buildMerkle = buildMerkle;

// new Level(dbpath, { valueEncoding: 'json' })
async function buildMerkle(db) {
    return new Merkle(db, new Hasher(await buildMimc()))
}

const accountKeyPrefix = "zacc_"

const AccountStatusValid = "accountValid"
const AccountStatusEliminable = "accountEliminable"

class Merkle {
    constructor(db, hasher) {
        this.db = db
        this.hasher = hasher
    }

    async addAccount(pub, balance) {
        const accCount = await this.getValidAccountCount()
        if (accCount >= 2) {
            throw new Error("merkle is full")
        }
        if (await this.isAccountValid(pub)) {
            throw new Error(util.format("account has been exist: ", pub))
        }

        await this.setAccount(pub, balance, 0, AccountStatusValid)
    }

    async root() {
        var hashs = []
        for await (const [key, value] of this.db.iterator({ gt: accountKeyPrefix })) {
            const acc = this.unmarshalAccount(value)
            hashs.push(await this.accountHash(acc))
        }

        return this.hasher.hashOf(hashs)
    }

    async getMerkleProof(pub) {
        var accounts = []
        for await (const [key, value] of this.db.iterator({ gt: accountKeyPrefix })) {
            accounts.push(this.unmarshalAccount(value))
        }

        if (accounts[0].pub[0].toString() == pub[0].toString() && accounts[0].pub[1].toString() == pub[1].toString()) {
            return {
                proof: [await this.accountHash(accounts[1])],
                pos: [1],
            }
        } if (accounts[1].pub[0].toString() == pub[0].toString() && accounts[1].pub[1].toString() == pub[1].toString()) {
            return {
                proof: [await this.accountHash(accounts[0])],
                pos: [0],
            }
        } else {
            throw new Error("unknown pub key for merkle proof")
        }
    }

    async accountHash(account) {
        //return await this.hasher.hashOf([account.pub[0], account.pub[1], account.balance, account.nonce])
        return await this.hasher.hashOf([account.pub[0], account.pub[1], account.balance])
    }

    async setAccountEliminable(pub) {
        var acc = await this.getAccount(pub)
        this.setAccount(acc.pub, acc.balance, acc.nonce, AccountStatusEliminable)
    }

    async accountHashByPub(pub) {
        const acc = await this.getAccount(pub)
        return await this.hasher.hashOf([acc.pub[0], acc.pub[1], acc.balance, acc.nonce])
    }

    async getValidAccountCount() {
        try {
            var validCount = 0
            for await (const [key, value] of this.db.iterator({ gt: accountKeyPrefix })) {
                const acc = this.unmarshalAccount(value)
                if (acc.status == AccountStatusValid) {
                    validCount += 1
                }
            }
            return validCount
        } catch (e) {
            return 0
        }
    }

    async isAccountValid(pub) {
        if (!await this.hasAccount(pub)) {
            return false
        }
        const acc = await this.getAccount(pub)
        return acc.status == AccountStatusValid
    }

    async hasAccount(pub) {
        try {
            const _ = await this.getAccount(pub)
            return true
        } catch (e) {
            return false
        }
    }

    async getAccount(pub) {
        const data = await this.db.get(this.accountKeyByPub(pub))
        return this.unmarshalAccount(data)
    }


    async setAccount(pub, balance, nonce, status) {
        await this.db.put(this.accountKeyByPub(pub), this.marshalAccount(pub, balance, nonce, status))
    }

    accountKeyByPub(pub) {
        return accountKeyPrefix + Buffer.from(this.hasher.hashOf(pub)).toString("hex")
    }

    marshalAccount(pub, balance, nonce, status) {
        const acc = {
            pub: [Buffer.from(pub[0]), Buffer.from(pub[1])],
            balance: balance,
            nonce: nonce,
            status: status,
        }
        return JSON.stringify(acc)
    }

    unmarshalAccount(data) {
        var acc = JSON.parse(data)
        const pub = [Buffer.from(acc.pub[0]), Buffer.from(acc.pub[1])]
        acc.pub = pub
        return acc
    }
}

class Hasher {
    constructor(mimc) {
        this.mimc = mimc
    }

    hashOf(vars) {
        return this.mimc.multiHash(vars)
    }
}
