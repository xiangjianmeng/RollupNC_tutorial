const bridgeProxy = require("../src/bridge").bridgeProxy;
let ks = require("../src/keystore");
const util = require("util")

async function query_pub(name) {
    const kstore = await ks.buildKStore()
    const user = kstore.getUser(name)
    return user.pub()
}

async function main() {
    depositInfo = [
        { name: "Bob", amount: 10000 },
        { name: "Alice", amount: 20000 },
    ]

    for (var i = 0; i < depositInfo.length; i++) {
        const di = depositInfo[i]
        const pub = await query_pub(di.name)
        await bridgeProxy.deposit(pub, di.amount)
    }

    console.log("deposit success:")
    for (var i = 0; i < depositInfo.length; i++) {
        const di = depositInfo[i]
        console.log(`${toAlignString(di.name, 8)}: deposit amount ${di.amount}`)
    }
    console.log("You can now using 'node cli/query.js account --name <NAME>' to query the account on layer2")
    console.log("You can also using 'node cli/l2_transfer.js' to transfer coin between those accounts")
}

function toAlignString(s, alignLen) {
    var nstr = s
    while (nstr.length < alignLen) nstr = nstr + " ";
    return nstr
}

main().then(() => {
    process.exit(0)
})