var program = require('commander');
const l2withdraw = require("./l2_withdraw").l2withdraw;
const bridgeProxy = require("../src/bridge").bridgeProxy;

async function main() {
    program
        .version('0.0.1')
        .option('-n, --name [name]', 'name of account to withdraw. See data/demo.key')
        .option('-c, --nonce [nonce]', 'nonce of account to withdraw')
        .parse(process.argv)
    const options = program.opts();

    const withdrawArgs = await l2withdraw(options.name, parseInt(options.nonce))
    if (!withdrawArgs.success) {
        console.log(withdrawArgs.msg)
        return
    }

    const args = withdrawArgs.msg
    await bridgeProxy.withdraw(args.l2pub, args.l2pubForProof, args.amount, args.proof, args.proofPos)
    console.log("withdraw success")
}

main().then(() => {
    process.exit(0)
})