let ks = require("../src/keystore");
var program = require('commander');

async function main() {
    program
        .version('0.0.1')
        .option('-f, --from [name]', 'name of from user. See data/demo.key')
        .option('-t, --to [name]', 'name of to user. See data/demo.key')
        .option('-a, --amount [token]', 'token amount need to be transfer')
        .option('-n, --nonce [nonce]', 'nonce of from user')
        .parse(process.argv)
    const options = program.opts();

    if (options.from == undefined ||
        options.to == undefined ||
        options.amount == undefined ||
        options.nonce == undefined) {
        program.help()
    }

    const kstore = await ks.buildKStore()
    const fromUser = kstore.getUser(options.from)
    const toUser = kstore.getUser(options.to)
    const amount = parseInt(options.amount)
    const nonce = parseInt(options.nonce)

    const from = fromUser.pub()
    const to = toUser.pub()
    //const sign = await fromUser.mimcSign([from[0], from[1], to[0], to[1], amount, nonce])
    const sign = await fromUser.mimcSign([from[0], from[1], to[0], to[1], amount])

    const tx = {
        from: from,
        to: to,
        nonce: nonce,
        amount: amount,
        sign: sign,
    }

    const request = require('request');

    const transfer_opts = {
        url: 'http://localhost:9973/transfer',
        json: true,
        body: {
            from: [to64hexString(from[0]), to64hexString(from[1])],
            to: [to64hexString(to[0]), to64hexString(to[1])],
            nonce: tx.nonce.toString(),
            amount: tx.amount.toString(),
            sign: { R8: [to64hexString(sign.R8[0]), to64hexString(sign.R8[1])], S: `0x${sign.S.toString(16)}` },
        }
    };
    request.post(transfer_opts, (err, res, body) => {
        if (err) {
            return console.log(err);
        }
        console.log(body);
    });
}

function to64hexString(s) {
    let nstr = Buffer.from(s).toString("hex")
    while (nstr.length < 64) nstr = "0" + nstr;
    return nstr
}

main()