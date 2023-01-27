var Web3 = require("web3");
var util = require('util');
const Logger = require("logplease");
const logger = Logger.create("deposit");

const contractAddress = '0xe3C9cb3E962d329fB41eeCF2c8EafE971412DE06';
const topics = ['0x39D3D971545F86DE37C2D290C969434D2CD0DD13298BB45F424EC4B7D4373AD0'];
const inputs = [
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
];

function listenDepositEvent(merkle) {
    logger.debug("start listen deposit event")
    let web3 = new Web3("ws://localhost:8546");

    // DepositEvent log
    return web3.eth.subscribe("logs", {
        address: contractAddress,
        topics: topics,
    }, function (error, log) {
        if (error) {
            console.log("DepositEvent error", error);
            return
        }

        logger.debug(util.format("get a deposit event: %o", log))
        const depositLog = web3.eth.abi.decodeLog(inputs, log['data'], log['topics'])
        const pub = [
            Buffer.from(BigInt(depositLog.pub[0]).toString(16), 'hex'),
            Buffer.from(BigInt(depositLog.pub[1]).toString(16), 'hex')
        ]

        logger.debug(util.format("deposit info: pub[0x%s, 0x%s]. amount:%d", pub[0].toString('hex'), pub[1].toString('hex'), depositLog.amount))
        merkle.addAccount(pub, parseInt(depositLog.amount))
    }
    )
}

exports.listenDepositEvent = listenDepositEvent;