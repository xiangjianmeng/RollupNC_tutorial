# Zk Rollup Tutorial

Head over to : https://keen-noyce-c29dfa.netlify.app

circom doc refer to https://docs.circom.io/getting-started/installation/

## 1. install snarkjs
```shell
npm install -g snarkjs@0.5.0
```

## 2. install circom 2.1.2, more refer to https://docs.circom.io/getting-started/installation/
```shell
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

## 3. run demo
```shell
# -d to assign work dir
# -n to assign trusted setup power
# -n to assign .circom filename in work dir
./run.sh -d ./4_single_tx -p 14 -n sample_circuit
```
