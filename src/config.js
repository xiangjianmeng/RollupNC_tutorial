const { readFileSync } = require("fs")
let path = require("path")

function loadConfig(cfgFile) {
    if (cfgFile == undefined) {
        cfgFile = path.join(__dirname, "../data/config.json")
    }

    const data = readFileSync(cfgFile)
    var cfg = JSON.parse(data)

    try {
        // bridge.json file may be not exist
        bridgeCfg = JSON.parse(readFileSync(path.join(__dirname, "../setup/bridge.json")))
        cfg.bridge = bridgeCfg
    } catch (_) {
        // do nothing
    }

    return cfg
}

function loadBridgeABI(abiFile) {
    if (abiFile == undefined) {
        abiFile = path.join(__dirname, "../setup/bridge.abi.json")
    }

    try {
        // bridge abi file may be not exist
        const data = readFileSync(abiFile).toString()
        return JSON.parse(data)
    } catch (_) {
        return ""
    }
}

exports.config = loadConfig();
exports.bridgeABI = loadBridgeABI();