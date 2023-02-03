const Logger = require("logplease");
const logger = Logger.create("bridge");

const cfgMod = require("./config");
const config = cfgMod.config;
const bridgeABI = cfgMod.bridgeABI;


function buildBridge() {
    var Contract = require('web3-eth-contract');
    Contract.setProvider('ws://localhost:8546');
    return new BridgeProxy(new Contract(bridgeABI, config.bridge.address))
}

class BridgeProxy {
    constructor(bridge) {
        this.bridge = bridge
        this.personal = null
    }

    async commitGroth16Proof(a, b, c, input) {
        await this.try_import_key()

        logger.debug("commit groth16 proof", a, b, c, input)
        try {
            if (await this.bridge.methods.commitGroth16Proof(a, b, c, input).call()) {
                await this.personal.unlockAccount(config.testAddress, config.testPwd, 10000)
                const res = await this.bridge.methods.commitGroth16Proof(a, b, c, input).send({ from: config.testAddress })
                logger.debug("contract verify success", res)
                return true
            }
            logger.debug("contract verify failed")
            return false
        } catch (e) {
            logger.error(e)
            return false
        }
    }

    async commitPlonkProof(proof, input) {
        await this.try_import_key()

        logger.debug("commit plonk proof", proof, input)
        try {
            if (await this.bridge.methods.commitPlonkProof(proof, input).call()) {
                await this.personal.unlockAccount(config.testAddress, config.testPwd, 10000)
                const res = await this.bridge.methods.commitPlonkProof(proof, input).send({ from: config.testAddress })
                logger.debug("contract verify success", res)
                return true
            }
            logger.debug("contract verify failed")
            return false
        } catch (e) {
            logger.error(e)
            return false
        }
    }

    async deposit(pub, value) {
        await this.try_import_key()

        logger.debug("deposit", pub)
        await this.personal.unlockAccount(config.testAddress, config.testPwd, 10000)
        const res = await this.bridge.methods.deposit(pub).send({ from: config.testAddress, value: value })
    }

    async withdraw(l2pub, l2pubForProof, amount, proof, proofPos) {
        await this.try_import_key()

        logger.debug("withdraw", l2pub)
        await this.personal.unlockAccount(config.testAddress, config.testPwd, 10000)
        const res = await this.bridge.methods.withdraw(l2pub, l2pubForProof, amount, proof, proofPos).send({ from: config.testAddress })
    }

    async claimWithdraw(pub) {
        await this.try_import_key()

        logger.debug("claim withdraw", pub)
        await this.personal.unlockAccount(config.testAddress, config.testPwd, 10000)
        await this.bridge.methods.claimWithdraw(pub).send({ from: config.testAddress })
    }

    async try_import_key() {
        if (this.personal == null) {
            var Personal = require('web3-eth-personal');
            this.personal = new Personal('ws://localhost:8546');
            await this.personal.importRawKey(config.testPrvKey, config.testPwd)
        }
    }
}

exports.bridgeProxy = buildBridge();

/*
let bridge = buildBridge()
bridge.commitProof(["0x0f7812c49a856d01ef947b9d5ab4cf65fce70b526d977cc584978145aab9dd07", "0x180ea96de04d195f0fcd81abe3d290e14a7d752fb36ba0eece54831fd42f4ef7"], [["0x0101f76ead6bf0af0b53ed4ad6661ad96c89588685c0adf6b719608414fbae79", "0x0889c5ee4e41f8c42599405d7539a56ffca603717d2a4a4b8d7e3776feb48bf4"], ["0x09f4f96b722c133727322e5217a5fe3c9c0bccdf6eb534930953b8244f809da4", "0x026d5fb1cf3192fc40898f3a248b5a945fa683ca8ec7298f0cf1790cfd76037b"]], ["0x2c2acc546c021ea347dac42a57f9a94fd4b92268e2ca38763e66d371a317caf5", "0x0620952818efd8292a03ece21ad13000bf125e021fe24c17ac238e06f0caf3b6"], ["0x2ad3b783184d0428772773a1e0da9a8fbd5e269dfb70bc1e6a873f63b47b70c5"]).then((success) => {
    console.log(success)
})
*/