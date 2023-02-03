let ks = require("../src/keystore");
var program = require('commander');

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
    const argsStr = `["${args.l2pub[0]}","${args.l2pub[1]}"],` +
        `["${args.l2pubForProof[0]}", "${args.l2pubForProof[1]}"],` +
        `${args.amount},` +
        `[${args.proof.map((p) => '"' + p + '"').join(",")}],` +
        `[${args.proofPos.map((p) => '"' + p + '"').join(",")}]`
    console.log(argsStr)
}

async function l2withdraw(name, nonce) {
    const kstore = await ks.buildKStore()
    const user = kstore.getUser(name)

    const pub = user.pub()
    const sign = await user.mimcSign([pub[0], pub[1], nonce])

    const request = require('request');
    const util = require("util")
    const transfer_opts = {
        url: 'http://localhost:9973/withdraw',
        json: true,
        body: {
            pub: [to64hexString(pub[0]), to64hexString(pub[1])],
            nonce: nonce.toString(),
            sign: { R8: [to64hexString(sign.R8[0]), to64hexString(sign.R8[1])], S: `0x${sign.S.toString(16)}` },
        }
    };
    const post = util.promisify(request.post)
    const res = await post(transfer_opts)
    if (res.body.success) {
        return { success: true, msg: res.body.msg }
    }
    return { success: false, msg: res.body.msg }
}

function to64hexString(s) {
    let nstr = Buffer.from(s).toString("hex")
    while (nstr.length < 64) nstr = "0" + nstr;
    return nstr
}

exports.l2withdraw = l2withdraw;

if (require.main === module) {
    main().then(() => {
        process.exit(0)
    })
}