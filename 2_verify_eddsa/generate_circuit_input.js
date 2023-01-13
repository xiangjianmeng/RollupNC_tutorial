const fs = require("fs");
// const circomjs = require("circomlibjs")
const ffj = require("ffjavascript");
const Eddsa = require("circomlibjs");

const fromHexString = hexString =>
    new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

async function generate() {
    let eddsa

    eddsa = await Eddsa.buildEddsa();

    const msgBuf = fromHexString("000102030405060708090000");
    const msg = eddsa.babyJub.F.e(ffj.Scalar.fromRprLE(msgBuf, 0));
    const prvKey = Buffer.from('1'.toString().padStart(64, '0'), "hex");
    const pubKey = eddsa.prv2pub(prvKey);

    const signature = eddsa.signMiMC(prvKey, msg);

    const F = eddsa.babyJub.F;

    const inputs = {
        "from_x": F.toString(pubKey[0]),//pubKey[0].toString(),
        "from_y": F.toString(pubKey[1]),//pubKey[1].toString(),
        "R8x": F.toString(signature['R8'][0]), //.toString(),
        "R8y": F.toString(signature['R8'][1]), //signature['R8'][1].toString(),
        "S": signature.S.toString(), //
        "M": F.toString(msg), //M.toString()
    }

    fs.writeFileSync(
        "./input.json",
        JSON.stringify(inputs),
        "utf-8"
    );
}

generate()
