const { readFileSync } = require("fs")
let path = require("path")

function loadConfig(cfgFile) {
    if (cfgFile == undefined) {
        cfgFile = path.join(__dirname, "../data/config.json")
    }

    const data = readFileSync(cfgFile)
    return JSON.parse(data)
}

function loadBridgeABI(abiFile) {
    if (abiFile == undefined) {
        abiFile = path.join(__dirname, "../data/bridge.abi.json")
    }

    const data = readFileSync(abiFile).toString()
    return JSON.parse(data)
}

exports.config = loadConfig();
exports.bridgeABI = loadBridgeABI();