const { readFileSync } = require("fs");
const { hasUncaughtExceptionCaptureCallback } = require("process");
const buildEddsa = require("circomlibjs").buildEddsa;

function buildKStore(path) {
    return new KStore(path)
}

class KStore {
    constructor(path) {
        if (path === undefined) {
            path = "userprv.key"
        }

        this.keys = JSON.parse(readFileSync(path, "utf8"));
    }

    getUser(name) {
        return new User(this.keys[name])
    }
}

class User {
    constructor(prvKey) {
        this.prvKey = Buffer.from(prvKey, "hex")
    }

    async mimcSign(data) {
        let eddsa = await buildEddsa();
        return eddsa.signMiMC(this.prvKey, data)
    }
}

exports.buildKStore = buildKStore;