// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

interface IVerifier {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[1] memory input
    ) external view returns (bool r);
}

interface IMiMC {
    function multiHash(uint256[] memory inputs)
        external
        view
        returns (uint256 out);
}

contract Bridge {
    event DepositEvent(uint256, uint256, uint256);

    IVerifier verifier;
    IMiMC mimc;

    mapping(uint256 => bool) roots;
    mapping(bytes32 => address) depositMap;

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
        uint256[1] memory input
    ) public returns (bool r) {
        r = false;

        if (verifier.verifyProof(a, b, c, input)) {
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

        emit DepositEvent(l2pub[0], l2pub[1], msg.value);
    }

    function withdraw(
        uint256[2] memory l2pub,
        uint256 amount,
        uint256[] memory proofs,
        bool[] memory isProofsRight
    ) public {
        uint256[] memory nodeArr = new uint256[](3);
        nodeArr[0] = l2pub[0];
        nodeArr[1] = l2pub[1];
        nodeArr[2] = amount;
        uint256 root = mimc.multiHash(nodeArr);

        uint256[] memory hashPair = new uint256[](2);
        for (uint256 i = 0; i < proofs.length; i++) {
            if (isProofsRight[i]) {
                hashPair[0] = root;
                hashPair[1] = proofs[i];
            } else {
                hashPair[0] = proofs[i];
                hashPair[1] = root;
            }
            root = mimc.multiHash(hashPair);
        }

        require(roots[root], "merkle is not verified");
        address payable target = payable(getDepositor(l2pub));
        target.transfer(amount);
    }
}
