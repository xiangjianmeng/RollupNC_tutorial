var Web3 = require("web3");

const contractAddress = '0x58d12b29931A258e788DDFd89267c472E1535bd9';
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

function handleDeposit(merkle) {
    let web3 = new Web3("ws://localhost:8546");

    // DepositEvent log
    var subscription = web3.eth.subscribe("logs", {
        address: contractAddress,
        topics: topics,
    }, function (error, log) {
        if (error) {
            console.log("DepositEvent error", error);
            return
        }

        const depositLog = web3.eth.abi.decodeLog(inputs, log['data'], log['topics'])
        console.log(depositLog);

        const pub0 = Buffer.from(depositLog.pub[0].toString().padStart(64, '0'), "hex")
        const pub1 = Buffer.from(depositLog.pub[1].toString().padStart(64, '0'), "hex")

        merkle.addAccount([pub0, pub1], parseInt(depositLog.amount))
    }
    )
}
