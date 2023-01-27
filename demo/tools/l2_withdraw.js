let ks = require("../src/keystore");
var program = require('commander');

async function main() {
    //const name = process.argv[1]
    //console.log(name)

    program
        .version('0.0.1')
        .option('-n, --name [name]', 'name of account to withdraw. See data/demo.key')
        .option('-c, --nonce [nonce]', 'nonce of account to withdraw')
        .parse(process.argv)
    const options = program.opts();

    const kstore = await ks.buildKStore()
    const user = kstore.getUser(options.name)

    const pub = user.pub()
    const nonce = parseInt(options.nonce)
    const sign = await user.mimcSign([pub[0], pub[1], nonce])

    const request = require('request');
    const transfer_opts = {
        url: 'http://localhost:9973/withdraw',
        json: true,
        body: {
            pub: [to64hexString(pub[0]), to64hexString(pub[1])],
            nonce: nonce.toString(),
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