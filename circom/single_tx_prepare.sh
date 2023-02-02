#!/usr/bin/env bash

set -e
set -o errexit
set -a
set -m
#set -x # activate debugging

Groth16="groth16"
Plonk="plonk"

NAME="single_tx"
PROTOCOL=${Groth16}
POWER=15

while getopts "p:c:" opt; do
  case $opt in
  p)
    echo "POWER=$OPTARG"
    POWER=$OPTARG
    ;;
  c)
    echo "PROTOCOL=$OPTARG"
    PROTOCOL=$OPTARG
    if [[ "$PROTOCOL" != "$Groth16" && "$PROTOCOL" != "$Plonk" ]]
    then
      echo "unsupport zk protocol ${PROTOCOL}"
      exit 1
    fi
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
snarkjs powersoftau contribute pot${POWER}_0000.ptau pot${POWER}_0001.ptau --name="First contribution" -v -e="adso"

# phase 2: circuit-specific
snarkjs powersoftau prepare phase2 pot${POWER}_0001.ptau pot${POWER}_final.ptau -v

if [ "$PROTOCOL" == "$Plonk" ]
then
  echo "plonk"
  snarkjs plonk setup ../${NAME}.r1cs pot${POWER}_final.ptau ${NAME}_0001.zkey
fi

if [ "$PROTOCOL" == "$Groth16" ]
then
  echo "groth16"
  snarkjs groth16 setup ../${NAME}.r1cs pot${POWER}_final.ptau ${NAME}_0000.zkey
  snarkjs zkey contribute ${NAME}_0000.zkey ${NAME}_0001.zkey --name="1st Contributor Name"  -e="ok23"
fi

snarkjs zkey export solidityverifier ${NAME}_0001.zkey verifier.sol

# we only need wasm, verifier.sol and zkey
mv ${NAME}.wasm ../../data/${NAME}.wasm
mv verifier.sol ../../contract/${PROTOCOL}_${NAME}_verifier.sol
mv ${NAME}_0001.zkey ../../data/${PROTOCOL}_${NAME}_0001.zkey

# remove the previously generated files
cd ..
rm -rf ${NAME}_js
rm -r ${NAME}.r1cs
