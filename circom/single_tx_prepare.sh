#!/usr/bin/env bash

set -e
set -o errexit
set -a
set -m
set -x # activate debugging

NAME="single_tx"
POWER=14

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
circom ${NAME}.circom --r1cs --wasm

cd ./${NAME}_js

# phase 1: Powers of Tau
snarkjs powersoftau new bn128 ${POWER} pot${POWER}_0000.ptau -v
snarkjs powersoftau contribute pot${POWER}_0000.ptau pot${POWER}_0001.ptau --name="First contribution" -v

# phase 2: circuit-specific
snarkjs powersoftau prepare phase2 pot${POWER}_0001.ptau pot${POWER}_final.ptau -v
snarkjs groth16 setup ../${NAME}.r1cs pot${POWER}_final.ptau ${NAME}_0000.zkey
snarkjs zkey contribute ${NAME}_0000.zkey ${NAME}_0001.zkey --name="1st Contributor Name" -v
snarkjs zkey export solidityverifier ${NAME}_0001.zkey verifier.sol

# we only need wasm, verifier.sol and zkey
mv ${NAME}.wasm ../../data/${NAME}.wasm
mv verifier.sol ../../contract/${NAME}_verifier.sol
mv ${NAME}_0001.zkey ../../data/${NAME}_0001.zkey

# remove the previously generated files
cd ..
rm -rf ${NAME}_js
rm -r ${NAME}.r1cs
