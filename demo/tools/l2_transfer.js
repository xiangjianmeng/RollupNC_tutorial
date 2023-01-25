let ks = require("../src/keystore")

var program = require('commander');
program
    .version('0.0.1')
    .option('-f, --from [name]', 'name of from user. See data/demo.key')
    .option('-t, --to [name]', 'name of to user. See data/demo.key')
    .option('-a, --amount [token]', 'token amount need to be transfer')
    .option('-n, --nonce ', 'nonce of from user')
    .parse(process.argv)
const options = program.opts();

if (options.from == undefined ||
    options.to == undefined ||
    options.amount == undefined ||
    options.nonce == undefined) {
    program.help()
}

const kstore = ks.buildKStore()
const fromUser = kstore.getUser(options.from)
const toUser = kstore.getUser(options.to)
const amount = parseInt(options.amount)
const nonce = parseInt(options.nonce)

const from = fromUser.pub()
const to = toUser.pub()
const sign = fromUser.mimcSign([from[0], from[1], to[0], to[1], amount, nonce])

const tx = {
    from: from,
    to: to,
    nonce: nonce,
    amount: amount,
    sign: sign,
}

// TODO: send it