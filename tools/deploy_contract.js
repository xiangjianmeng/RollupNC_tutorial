var solc = require('solc');
const { readFileSync, writeFileSync } = require("fs");
const path = require("path");
const cfgMod = require("../src/config");
const config = cfgMod.config;

function compile_sol(name, source) {
    var input = {
        language: 'Solidity',
        sources: {
            name: { content: source }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode']
                }
            }
        }
    };

    return JSON.parse(solc.compile(JSON.stringify(input)));
}

function compile_groth16_verifier() {
    const solname = 'groth16.sol'
    const sourceOrg = readFileSync(path.join(__dirname, "../setup/groth16_single_tx_verifier.sol"))
    const source = sourceOrg.toString().replace(/pragma solidity \^/, "pragma solidity >=")
    const output = compile_sol(solname, source)

    const contractVerifier = output.contracts.name.Verifier
    const bytecode = contractVerifier.evm.bytecode.object
    const abi = JSON.stringify(contractVerifier.abi)

    return { bytecode: bytecode, abi: abi }
}

function compile_plonk_verifier() {
    const solname = 'plonk.sol'
    const source = readFileSync(path.join(__dirname, "../setup/plonk_single_tx_verifier.sol"))
    const output = compile_sol(solname, source.toString())

    const contractVerifier = output.contracts.name.PlonkVerifier
    const bytecode = contractVerifier.evm.bytecode.object
    const abi = JSON.stringify(contractVerifier.abi)

    return { bytecode: bytecode, abi: abi }
}

function compile_mimc() {
    const solname = 'mimc.sol'
    const source = readFileSync(path.join(__dirname, "../contract/mimc.sol"))
    const output = compile_sol(solname, source.toString())

    const contract = output.contracts.name.MiMC
    const bytecode = contract.evm.bytecode.object
    const abi = JSON.stringify(contract.abi)

    return { bytecode: bytecode, abi: abi }
}

function compile_bridge() {
    const solname = 'bridge.sol'
    const source = readFileSync(path.join(__dirname, "../contract/bridge.sol"))
    const output = compile_sol(solname, source.toString())

    const contract = output.contracts.name.Bridge
    const bytecode = contract.evm.bytecode.object
    const abi = JSON.stringify(contract.abi)

    return { bytecode: bytecode, abi: abi }

}

async function main() {
    const groth16_artifact = compile_groth16_verifier()
    const plonk_artifact = compile_plonk_verifier()
    const mimc_artifact = compile_mimc()
    const bridge_artifact = compile_bridge()

    const groth16_address = await deploy(groth16_artifact)
    //console.log("gorth16 addr", groth16_address)
    const plonk_address = await deploy(plonk_artifact)
    //console.log("plonk addr", plonk_address)
    const mimc_address = await deploy(mimc_artifact)
    //console.log("mimc address", mimc_address)

    const bridge_address = await deploy(bridge_artifact, [groth16_address, plonk_address, mimc_address])
    console.log("bridge address", bridge_address)

    writeFileSync(path.join(__dirname, "../setup/bridge.json"), JSON.stringify({ address: bridge_address }))
    writeFileSync(path.join(__dirname, "../setup/bridge.abi.json"), bridge_artifact.abi)

}

async function deploy(contractArtifact, args) {
    var Contract = require('web3-eth-contract');
    //Contract.setProvider('ws://localhost:8546');
    Contract.setProvider('http://127.0.0.1:8545');
    contract = new Contract(JSON.parse(contractArtifact.abi))

    var Personal = require('web3-eth-personal');
    //const personal = new Personal('ws://localhost:8546');
    const personal = new Personal('http://127.0.0.1:8545');
    await personal.importRawKey(config.testPrvKey, config.testPwd)
    await personal.unlockAccount(config.testAddress, config.testPwd, 10000)

    const deployed = await contract.deploy({ data: contractArtifact.bytecode, arguments: args }).send({ from: config.testAddress })
    return deployed.options.address
}

main().then(() => {
    process.exit(0)
})