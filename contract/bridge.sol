// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

interface IVerifier {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[2] memory input
    ) external view returns (bool r);
}

interface IMiMC {
    function multiHash(uint256[] memory inputs)
        external
        view
        returns (uint256 out);
}

contract Bridge {
    event DepositEvent(uint256[2] pub, uint256 amount);

    IVerifier verifier;
    IMiMC mimc;

    mapping(uint256 => bool) roots;
    uint256 prevRoot;
    mapping(bytes32 => address) depositMap;
    mapping(bytes32 => bool) withdrawClaimed;

    constructor(address _verifier, address _mimc) {
        verifier = IVerifier(_verifier);
        mimc = IMiMC(_mimc);
    }

    function calcL2PubHash(uint256[2] memory l2pub)
        private
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(l2pub[0], l2pub[1]));
    }

    function getDepositor(uint256[2] memory l2pub)
        private
        view
        returns (address)
    {
        return depositMap[calcL2PubHash(l2pub)];
    }

    function setDepositor(uint256[2] memory l2pub) private {
        depositMap[calcL2PubHash(l2pub)] = msg.sender;
    }

    function commitProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[2] memory input
    ) public returns (bool r) {
        r = false;
        // TODO: require prevRoot == input[1]
        //require(prevRoot == input[1], "old merkle root of proof is invalid");

        if (verifier.verifyProof(a, b, c, input)) {
            prevRoot = input[0];
            roots[input[0]] = true;
            r = true;
        } else {
            roots[input[0]] = false;
        }

        return r;
    }

    function deposit(uint256[2] memory l2pub) public payable {
        require(msg.value != 0, "deposit need some token");

        setDepositor(l2pub);

        emit DepositEvent(l2pub, msg.value);
    }

    function claimWithdraw(uint256[2] memory l2pub) public {
        // TODO: require deployer

        bytes32 hash = calcL2PubHash(l2pub);
        withdrawClaimed[hash] = true;
    }

    function withdraw(
        uint256[2] memory l2pub,
        uint256[2] memory l2pubForProof,
        uint256 amount,
        uint256[] memory proof,
        uint256[] memory proofPos
    ) public {
        bytes32 pubhash = calcL2PubHash(l2pub);
        require(withdrawClaimed[pubhash], "not claim withdraw");

        uint256[] memory nodeArr = new uint256[](3);
        nodeArr[0] = l2pubForProof[0];
        nodeArr[1] = l2pubForProof[1];
        nodeArr[2] = amount;
        uint256 root = mimc.multiHash(nodeArr);

        uint256[] memory hashPair = new uint256[](2);
        for (uint256 i = 0; i < proof.length; i++) {
            if (0 == proofPos[i]) {
                hashPair[0] = proof[i];
                hashPair[1] = root;
            } else {
                hashPair[0] = root;
                hashPair[1] = proof[i];
            }
            root = mimc.multiHash(hashPair);
        }

        require(roots[root], "merkle is not verified");

        delete withdrawClaimed[pubhash];
        address payable target = payable(getDepositor(l2pub));
        target.transfer(amount);
    }
}
