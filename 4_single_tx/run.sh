#!/usr/bin/env bash

set -e
set -o errexit
set -a
set -m
set -x # activate debugging

TYPE=WASM
NAME=""
POWER=12

while getopts "tn:xp:" opt; do
  case $opt in
  t)
    echo "choose C++ type"
    TYPE=C
    ;;
  x)
    echo "POWER=$OPTARG"
    POWER=$OPTARG
    ;;
  p)
    echo "POWER=$OPTARG"
    POWER=$OPTARG
    ;;
  n)
    echo "NAME=$OPTARG"
    NAME=$OPTARG
    ;;
  \?)
    echo "Invalid option: -$OPTARG"
    ;;
  esac
done

# compile circuit
circom ${NAME}.circom --r1cs --wasm --sym --c

# convert sample_get_merkle_root to generate_get_merkle_root_input.js
node generate_${NAME#*_}_input.js

# Computing the witness
if [ "$TYPE" == "WASM" ]; then
  cd ./${NAME}_js
  node generate_witness.js ${NAME}.wasm ../input.json witness.wtns

  # phase 1: Powers of Tau
  snarkjs powersoftau new bn128 ${POWER} pot${POWER}_0000.ptau -v
  snarkjs powersoftau contribute pot${POWER}_0000.ptau pot${POWER}_0001.ptau --name="First contribution" -v

  # phase 2: circuit-specific
  snarkjs powersoftau prepare phase2 pot${POWER}_0001.ptau pot${POWER}_final.ptau -v
  snarkjs groth16 setup ../${NAME}.r1cs pot${POWER}_final.ptau ${NAME}_0000.zkey
  snarkjs zkey contribute ${NAME}_0000.zkey ${NAME}_0001.zkey --name="1st Contributor Name" -v
  snarkjs zkey export verificationkey ${NAME}_0001.zkey verification_key.json

  # Generating a Proof
  snarkjs groth16 prove ${NAME}_0001.zkey witness.wtns proof.json public.json

  # Verifying a Proof
  snarkjs groth16 verify verification_key.json public.json proof.json

else
  cd ./${NAME}_cpp
  make
  ./${NAME} ../input.json witness.wtns
fi
