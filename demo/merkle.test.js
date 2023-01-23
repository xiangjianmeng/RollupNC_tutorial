let mk = require("./merkle")

test("aaa", async () => {
    const level = require('level-test')()
    const db = level({ valueEncoding: 'json' })

    const merkle = await mk.buildMerkle(db)

    await merkle.addAccount([[0x01], [0x03]], 2)
    await merkle.addAccount([[0x01], [0x04]], 2)
    const root = Buffer.from(await merkle.root()).toString("hex")

    expect(root).toStrictEqual("b22cc5f0c8889674338317e0a6470cde993d99c7eb8a40563b3315bddf0df306")
})