var Web3 = require("web3");
var util = require('util');
const Logger = require("logplease");
const logger = Logger.create("deposit");

const contractAddress = '0x5Cb5e87f4edb93ecA137De6F8a0905D7165D74Ee';
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
        "name": "amount", // * 0.00001okt
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

        const msg = util.format("get a deposit event: %o", inputs)
        console.log(msg)
        logger.debug(msg)
        const depositLog = web3.eth.abi.decodeLog(inputs, log['data'], log['topics'])

        const pub0 = Buffer.from(depositLog.pub[0].toString().padStart(64, '0'), "hex")
        const pub1 = Buffer.from(depositLog.pub[1].toString().padStart(64, '0'), "hex")

        const msg2 = util.format("deposit info: pub[%s, %s]. amount:%d", pub0, pub1, depositLog.amount)
        console.log(msg)
        logger.debug(msg)
        merkle.addAccount([pub0, pub1], parseInt(depositLog.amount))
    }
    )
}

exports.listenDepositEvent = listenDepositEvent;