let ks = require("../src/keystore");
var program = require('commander');

async function main() {
    program
        .version('0.0.1')
        .option('-n, --name [name]', 'name of from user. See data/demo.key')
        .parse(process.argv)
    const options = program.opts();

    const kstore = await ks.buildKStore()
    const user = kstore.getUser(options.name)
    const pub = user.pub()

    console.log("public key:", [to64hexString(pub[0]), to64hexString(pub[1])])
}

function to64hexString(s) {
    let nstr = Buffer.from(s).toString("hex")
    while (nstr.length < 64) nstr = "0" + nstr;
    return `0x${nstr}`
}

main()