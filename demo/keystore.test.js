let ks = require("./keystore")
const buildMimc = require("circomlibjs").buildMimc7;

test("mimcSign", async () => {
    const kstore = ks.buildKStore()
    let u = kstore.getUser("Bob")
    let mimc = await buildMimc()
    let hash = mimc.multiHash([0x01, 0x02])
    let sign = await u.mimcSign(hash)

    const signObj = {
        "r8x": Buffer.from(sign.R8[0]).toString("hex"),
        "r8y": Buffer.from(sign.R8[1]).toString("hex"),
        "S": sign.S.toString(),
    }

    const expectData = {
        "r8x": "31ebd0db32ce809b36bd6fcbff7b97cffd2d3e9684d70f169ba40f4d2d5b8f22",
        "r8y": "f31ab0c6a6ba7df9d5b6f32d19f9f3c5b23f0b5bd754fdd4ee19452a1c57221b",
        "S": "2494084479005672954810443506445605730964615583907363615645014514378563461863",
    }

    expect(signObj).toStrictEqual(expectData)
})