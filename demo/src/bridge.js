const Logger = require("logplease");
const logger = Logger.create("bridge");

const testPwd = "123456"
const testAddress = "0x4C12e733e58819A1d3520f1E7aDCc614Ca20De64"
const testPrvKey = "b7700998b973a2cae0cb8e8a328171399c043e57289735aca5f2419bd622297a"

const bridgeAddress = "0xe3C9cb3E962d329fB41eeCF2c8EafE971412DE06"
const abi = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_verifier",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_mimc",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256[2]",
                "name": "pub",
                "type": "uint256[2]"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "DepositEvent",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[2]",
                "name": "l2pub",
                "type": "uint256[2]"
            }
        ],
        "name": "claimWithdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[2]",
                "name": "a",
                "type": "uint256[2]"
            },
            {
                "internalType": "uint256[2][2]",
                "name": "b",
                "type": "uint256[2][2]"
            },
            {
                "internalType": "uint256[2]",
                "name": "c",
                "type": "uint256[2]"
            },
            {
                "internalType": "uint256[1]",
                "name": "input",
                "type": "uint256[1]"
            }
        ],
        "name": "commitProof",
        "outputs": [
            {
                "internalType": "bool",
                "name": "r",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[2]",
                "name": "l2pub",
                "type": "uint256[2]"
            }
        ],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[2]",
                "name": "l2pub",
                "type": "uint256[2]"
            },
            {
                "internalType": "uint256[2]",
                "name": "l2pubForProof",
                "type": "uint256[2]"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "uint256[]",
                "name": "proof",
                "type": "uint256[]"
            },
            {
                "internalType": "uint256[]",
                "name": "proofPos",
                "type": "uint256[]"
            }
        ],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

function buildBridge() {
    var Contract = require('web3-eth-contract');
    Contract.setProvider('ws://localhost:8546');
    return new BridgeProxy(new Contract(abi, bridgeAddress))
}

class BridgeProxy {
    constructor(bridge) {
        this.bridge = bridge
        this.personal = null
    }

    async commitProof(a, b, c, input) {
        if (this.personal == null) {
            var Personal = require('web3-eth-personal');
            this.personal = new Personal('ws://localhost:8546');
            await this.personal.importRawKey(testPrvKey, testPwd)
        }

        logger.debug("commit zk proof", a, b, c, input)
        try {
            if (await this.bridge.methods.commitProof(a, b, c, input).call()) {
                await this.personal.unlockAccount(testAddress, testPwd, 10000)
                const res = await this.bridge.methods.commitProof(a, b, c, input).send({ from: testAddress })
                logger.debug("contract verify success", res)
                return true
            }
            logger.debug("contract verify failed")
            return false
        } catch (e) {
            console.log(e)
            return false
        }
    }

    async claimWithdraw(pub) {
        if (this.personal == null) {
            var Personal = require('web3-eth-personal');
            this.personal = new Personal('ws://localhost:8546');
            await this.personal.importRawKey(testPrvKey, testPwd)
        }

        logger.debug("claim withdraw", pub)
        await this.personal.unlockAccount(testAddress, testPwd, 10000)
        await this.bridge.methods.claimWithdraw(pub).send({ from: testAddress })
    }
}

exports.bridgeProxy = buildBridge();

/*
let bridge = buildBridge()
bridge.commitProof(["0x0f7812c49a856d01ef947b9d5ab4cf65fce70b526d977cc584978145aab9dd07", "0x180ea96de04d195f0fcd81abe3d290e14a7d752fb36ba0eece54831fd42f4ef7"], [["0x0101f76ead6bf0af0b53ed4ad6661ad96c89588685c0adf6b719608414fbae79", "0x0889c5ee4e41f8c42599405d7539a56ffca603717d2a4a4b8d7e3776feb48bf4"], ["0x09f4f96b722c133727322e5217a5fe3c9c0bccdf6eb534930953b8244f809da4", "0x026d5fb1cf3192fc40898f3a248b5a945fa683ca8ec7298f0cf1790cfd76037b"]], ["0x2c2acc546c021ea347dac42a57f9a94fd4b92268e2ca38763e66d371a317caf5", "0x0620952818efd8292a03ece21ad13000bf125e021fe24c17ac238e06f0caf3b6"], ["0x2ad3b783184d0428772773a1e0da9a8fbd5e269dfb70bc1e6a873f63b47b70c5"]).then((success) => {
    console.log(success)
})
*/