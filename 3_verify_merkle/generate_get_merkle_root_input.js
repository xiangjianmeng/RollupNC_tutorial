const fs = require("fs");
const buildMimc = require("circomlibjs").buildMimc7;
const mimcMerkle = require('./MiMCMerkle.js')

async function generate() {
    let m = await buildMimc();
    const leaf1 = m.multiHash([1, 2, 3])
    const leaf2 = m.multiHash([4, 5, 6])
    const leaf3 = m.multiHash([7, 8, 9])
    const leaf4 = m.multiHash([9, 8, 7])
    const leafArray = [leaf1, leaf2, leaf3, leaf4]

    const tree = mimcMerkle.treeFromLeafArray(leafArray, m)
    const root = tree[0][0];
    const leaf1Proof = mimcMerkle.getProof(0, tree, leafArray)
    const leaf1Pos = mimcMerkle.idxToBinaryPos(0, 2)

    const inputs = {
        "leaf": m.F.toString(leaf1),
        "paths2_root": [m.F.toString(leaf1Proof[0]), m.F.toString(leaf1Proof[1])],
        "paths2_root_pos": leaf1Pos
    }

    fs.writeFileSync(
        "./input.json",
        JSON.stringify(inputs),
        "utf-8"
    );
}

generate();