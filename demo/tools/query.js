let ks = require("../src/keystore");
var program = require('commander');

async function main() {
    program.version('0.0.1')

    program.command('keys')
        .option('-n, --name <name>', 'name of from user. See data/demo.key')
        .action(async function () {
            const name = this.opts().name
            await query_keys(name)
        }).opts()

    program.command('account')
        .option('-n, --name <name>', 'name of from user. See data/demo.key')
        .action(async function () {
            const name = this.opts().name
            query_account(name)
        }).opts()

    await program.parseAsync(process.argv)

}

async function query_keys(name) {
    const user = await getUserByName(name)
    const pub = user.pub()

    console.log("public key:", [to64hexString(pub[0]), to64hexString(pub[1])])
}

async function query_account(name) {
    const user = await getUserByName(name)
    const pub = user.pub()

    const request = require('request');
    const transfer_opts = {
        url: 'http://localhost:9973/account',
        json: true,
        body: {
            pub: [to64hexString(pub[0]), to64hexString(pub[1])],
        }
    };
    request.get(transfer_opts, (err, res, body) => {
        if (err) {
            return console.log(err);
        }
        console.log(body);
    });
}

async function getUserByName(name) {
    const kstore = await ks.buildKStore()
    return kstore.getUser(name)
}

function to64hexString(s) {
    let nstr = Buffer.from(s).toString("hex")
    while (nstr.length < 64) nstr = "0" + nstr;
    return nstr
}

main()