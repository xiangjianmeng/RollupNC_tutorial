#!/usr/bin/env bash

set -e
set -o errexit
set -a
set -m
#set -x # activate debugging

POWER=15

while getopts "p:" opt; do
  case $opt in
  p)
    echo "POWER=$OPTARG"
    POWER=$OPTARG
    ;;
  \?)
    echo "Invalid option: -$OPTARG"
    ;;
  esac
done

# compile circuit
circom single_tx.circom --r1cs --wasm

cd ./single_tx_js

# phase 1: Powers of Tau
snarkjs powersoftau new bn128 ${POWER} pot_0000.ptau 
snarkjs powersoftau contribute pot_0000.ptau pot_0001.ptau --name="First contribution" -v -e="adso"

# phase 2: circuit-specific
snarkjs powersoftau prepare phase2 pot_0001.ptau pot_final.ptau 

# new plonk zkey
echo "setup plonk"
snarkjs plonk setup ../single_tx.r1cs pot_final.ptau plonk_single_tx_0001.zkey

# new and contribute groth16 zkey
echo "setup groth16"
snarkjs groth16 setup ../single_tx.r1cs pot_final.ptau groth16_single_tx_0000.zkey
snarkjs zkey contribute groth16_single_tx_0000.zkey groth16_single_tx_0001.zkey --name="1st Contributor Name"  -e="ok23"

echo "zkey export"
snarkjs zkey export solidityverifier plonk_single_tx_0001.zkey plonk_verifier.sol
snarkjs zkey export solidityverifier groth16_single_tx_0001.zkey groth16_verifier.sol

# we only need wasm, verifier.sol and zkey
mv single_tx.wasm ../../setup/single_tx.wasm
mv plonk_verifier.sol ../../setup/plonk_single_tx_verifier.sol
mv plonk_single_tx_0001.zkey ../../setup/plonk_single_tx_0001.zkey
mv groth16_verifier.sol ../../setup/groth16_single_tx_verifier.sol
mv groth16_single_tx_0001.zkey ../../setup/groth16_single_tx_0001.zkey

# remove the previously generated files
cd ..
rm -rf single_tx_js
rm -r single_tx.r1cs
