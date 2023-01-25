const { readFileSync } = require("fs");
const buildEddsa = require("circomlibjs").buildEddsa;
const buildMimc = require("circomlibjs").buildMimc7;

exports.buildKStore = buildKStore;

async function buildKStore(path) {
    let eddsa = await buildEddsa()
    let mimc = await buildMimc()
    return new KStore(path, eddsa, mimc)
}

class KStore {
    constructor(keyPath, eddsa, mimc) {
        if (keyPath === undefined) {
            var path = require("path")
            keyPath = path.join(__dirname, "../data/demo.key")
        }

        this.eddsa = eddsa
        this.mimc = mimc
        this.keys = JSON.parse(readFileSync(keyPath, "utf8"));
    }

    getUser(name) {
        return new User(this.keys[name], this.eddsa, this.mimc)
    }
}

class User {
    constructor(prvKey, eddsa, mimc) {
        this.eddsa = eddsa
        this.mimc = mimc
        this.prvKey = Buffer.from(prvKey, "hex")
    }

    pub() {
        return this.eddsa.prv2pub(this.prvKey)
    }

    async mimcSign(items) {
        const hash = this.mimc.multiHash(items);
        return this.eddsa.signMiMC(this.prvKey, hash)
    }
}
