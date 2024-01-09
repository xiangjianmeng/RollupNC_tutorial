pragma circom 2.0.0;

include "../circomlib/circuits/poseidon.circom";

template Main() {
    signal input in;
    signal output out;

    component hasher = Poseidon(1);
    hasher.inputs[0] <== in;
    out <== hasher.out;
}

component main {public[in]} = Main();