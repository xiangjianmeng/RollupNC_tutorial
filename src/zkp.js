const bridgeProxy = require("./bridge").bridgeProxy;
const { parentPort } = require("node:worker_threads");
const snarkjs = require("snarkjs");

const Logger = require("logplease");
const logger = Logger.create("zkp");
Logger.setLogLevel("INFO");

let path = require("path");
const wasm_file = path.join(__dirname, "../data/single_tx.wasm")



/*
parentPort.on("message", (zkp_inputs) => {
    const result = submitProve(zkp_inputs);
    parentPort.postMessage(result);
});
*/

async function submitProve(inputs, zkProtocol) {
    const zkey1_file = path.join(__dirname, `../data/${zkProtocol}_single_tx_0001.zkey`)
    // generate witness
    const witness = await gen_witness(inputs)

    if (zkProtocol == "groth16") {
        return submitGroth16Proof(witness, zkey1_file)
    } else if (zkProtocol == "plonk") {
        return submitPlonkProof(witness, zkey1_file)
    } else {
        let util = require("util")
        throw util.format("unsupport zk protocol %s", zkProtocol)
    }

}

async function submitGroth16Proof(witness, zkey1_file) {
    const { proof, publicSignals } = await gen_groth16_proof(zkey1_file, witness)
    await groth16_verify(zkey1_file, proof, publicSignals)

    const { a, b, c, input } = await gen_groth16_solidity_verifier_arguments(proof, publicSignals)
    return await bridgeProxy.commitGroth16Proof(a, b, c, input)
}

async function submitPlonkProof(witness, zkey1_file) {
    const { proof, publicSignals } = await gen_plonk_proof(zkey1_file, witness)
    await plonk_verify(zkey1_file, proof, publicSignals)

    const args = await gen_plonk_solidity_verifier_arguments(proof, publicSignals)
    const splitIndex = args.indexOf(",")
    const proofArr = Buffer.from(args.substring(2, splitIndex), "hex")

    const regexp = /0x([0-9a-fA-F]+)/g
    const rest = args.substring(splitIndex + 1)
    const reResult = [...rest.matchAll(regexp)]//.map(x => Buffer.from(x, "hex"))
    const public = [Buffer.from(reResult[0][1], "hex"), Buffer.from(reResult[1][1], "hex")]

    return await bridgeProxy.commitPlonkProof(proofArr, public)
}

async function gen_witness(inputs) {
    const wtns = {
        type: "mem"
    };
    await snarkjs.wtns.calculate(inputs, wasm_file, wtns)
    return wtns
}

async function gen_groth16_proof(zkey1, witness) {
    return await snarkjs.groth16.prove(zkey1, witness, logger)
}

async function gen_plonk_proof(zkey1, witness) {
    return await snarkjs.plonk.prove(zkey1, witness, logger)
}

async function gen_groth16_solidity_verifier_arguments(proof, publicSignals) {
    //return await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
    const input = publicSignals.map(n => { return p256$1(n) })

    const a = [p256$1(proof.pi_a[0]), p256$1(proof.pi_a[1])]
    const b = [[p256$1(proof.pi_b[0][1]), p256$1(proof.pi_b[0][0])], [p256$1(proof.pi_b[1][1]), p256$1(proof.pi_b[1][0])]]
    const c = [p256$1(proof.pi_c[0]), p256$1(proof.pi_c[1])]

    return { a, b, c, input }
}

async function gen_plonk_solidity_verifier_arguments(proof, publicSignals) {
    return await snarkjs.plonk.exportSolidityCallData(proof, publicSignals)
}

async function prepare_ptau() {
    const ptau_final = { type: "bigMem" };
    await snarkjs.powersOfTau.preparePhase2(ptau_file, ptau_final, logger);
    return ptau_final
}

async function gen_zkey(final_ptau) {
    const zkey_file = { type: "bigMem" };
    await snarkjs.zKey.newZKey(r1cs_file, final_ptau, zkey_file, logger);
    return zkey_file
}

async function zkey_contribute(zkey0) {
    const zkey1 = { type: "bigMem" };
    await snarkjs.zKey.contribute(zkey0, zkey1, "signle_tx 1st Contributor", randomString(6), logger)
    return zkey1
}


async function groth16_verify(zkey1, proof, pub) {
    const vKey = await snarkjs.zKey.exportVerificationKey(zkey1);
    const isValid = await snarkjs.groth16.verify(vKey, pub, proof, logger);
}

async function plonk_verify(zkey1, proof, pub) {
    const vKey = await snarkjs.zKey.exportVerificationKey(zkey1);
    snarkjs.plonk.verify(vKey, pub, proof, logger)
}


function randomString(e) {
    e = e || 32;
    var t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
        a = t.length,
        n = "";
    for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
    return n
}

function p256$1(s) {
    const n = BigInt(s)
    let nstr = n.toString(16);
    while (nstr.length < 64) nstr = "0" + nstr;
    nstr = `0x${nstr}`;
    return nstr;
}


exports.submitProve = submitProve;


/*
async function test() {
    const inputs = { accounts_root: "19533904476379630464137665927267401438125493240475876512046268355788561679672", intermediate_root: "6371339828236850749269313130584395025413863707850649407492871723117320930408", accounts_pubkeys: [["1891156797631087029347893674931101305929404954783323547727418062433377377293", "14780632341277755899330141855966417738975199657954509255716508264496764475094"], ["16854128582118251237945641311188171779416930415987436835484678881513179891664", "8120635095982066718009530894702312232514551832114947239433677844673807664026"]], accounts_balances: [500, 0], sender_pubkey: ["1891156797631087029347893674931101305929404954783323547727418062433377377293", "14780632341277755899330141855966417738975199657954509255716508264496764475094"], sender_balance: 500, receiver_pubkey: ["16854128582118251237945641311188171779416930415987436835484678881513179891664", "8120635095982066718009530894702312232514551832114947239433677844673807664026"], receiver_balance: 0, amount: 500, signature_R8x: "4148208700003940472622207590861278545411919939915983915924330609282854839847", signature_R8y: "12627475812719161205511610748684272124721680895566844477087524508061200615516", signature_S: "1082414279374035086891545379326332233439963958313637546647479497117488014692", sender_proof: ["3803138130493202110624714983574220862418769550589774844759960662710211847393"], sender_proof_pos: [1], receiver_proof: ["12398322849661901239224435721555926395919756785475129821938639142229281508087"], receiver_proof_pos: [0] }
    console.log(await submitProve(inputs))
}

test()
*/