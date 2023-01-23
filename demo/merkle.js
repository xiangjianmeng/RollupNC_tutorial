const { tester } = require('circom');
const { Level } = require('level')
const buildMimc = require("circomlibjs").buildMimc7;
var util = require('util');

// new Level(dbpath, { valueEncoding: 'json' })
async function buildMerkle(db) {
    return new Merkle(db, new Hasher(await buildMimc()))
}

exports.buildMerkle = buildMerkle;

const keyAccountCount = "accountCount"
const accountKeyPrefix = "zacc_"

const AccountStatusValid = "accountValid"
const AccountStatusEliminable = "accountEliminable"

class Merkle {
    constructor(db, hasher) {
        this.db = db
        this.hasher = hasher
    }

    async addAccount(pub, balance) {
        const accCount = await this.getAccountCount()
        if (accCount >= 2) {
            throw new Error("merkle is full")
        }
        if (await this.accountValid(pub)) {
            throw new Error(util.format("account has been exist: ", pub))
        }

        await this.setAccount(pub, balance, 0, AccountStatusValid)
        await this.setAccountCount(accCount + 1)
    }

    async root() {
        var hashs = []
        for await (const [key, value] of this.db.iterator({ gt: accountKeyPrefix })) {
            const acc = JSON.parse(value)
            hashs.push(await this.accountHash(acc))
        }

        return this.hasher.hashOf(hashs)
    }

    async accountHash(account) {
        return await this.hasher.hashOf([account.pub[0], account.pub[1], account.balance, account.nonce])
    }

    async setAccountEliminable(pub) {
        var acc = await this.getAccount(pub)
        this.setAccount(acc.pub, acc.balance, acc.nonce, AccountStatusEliminable)
    }

    async accountHashByPub(pub) {
        const acc = await this.getAccount(pub)
        return await this.hasher.hashOf([acc.pub[0], acc.pub[1], acc.balance, acc.nonce])
    }

    async getAccountCount() {
        try {
            const data = await this.db.get(keyAccountCount)
            const cnt = JSON.parse(data)
            return cnt
        } catch (e) {
            return 0
        }
    }

    async setAccountCount(cnt) {
        await this.db.put(keyAccountCount, JSON.stringify(cnt))
    }

    async accountValid(pub) {
        if (!await this.hasAccount(pub)) {
            return false
        }
        const acc = await this.getAccount(pub)
        return acc.status = AccountStatusValid
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
        return JSON.parse(data)
    }


    async setAccount(pub, balance, nonce, status) {
        const acc = {
            pub: pub,
            balance: balance,
            nonce: nonce,
            status: AccountStatusValid
        }
        await this.db.put(this.accountKeyByPub(pub), JSON.stringify(acc))
    }

    accountKeyByPub(pub) {
        return accountKeyPrefix + Buffer.from(this.hasher.hashOf(pub)).toString("hex")
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
