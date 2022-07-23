//[assignment] write your own unit test to show that your Mastermind variation circuit is working as expected
const { expect, assert } = require("chai");
const buildPoseidon = require("circomlibjs").buildPoseidon;
const { groth16 } = require("snarkjs");
const { ethers } = require("ethers")

const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

describe("MasterMind", function () {
    this.timeout(100000000);

    const code = [1, 2, 3, 4, 5];
    const salt = [25];
    let input;
    let hash;
    beforeEach(async function () {

        poseidonJs = await buildPoseidon();

        hash = ethers.BigNumber.from(poseidonJs.F.toObject(poseidonJs(salt.concat(code))))

        input = {
            "pubGuess": ["0", "0", "0", "0", "0"],
            "punNumberHits": "0",
            "pubNumberBlows": "0",
            "pubHash": hash,
            "solution": code,
            "salt": salt
        }
    });

    it("Circuit should validate Hash", async function () {
        const circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");
        const witness = await circuit.calculateWitness(input, true);
        assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]), Fr.e(hash)));

    });

    it("Circuit should have correct number of hits", async function () {
        input.pubGuess = ["1", "0", "3", "0", "5"];
        input.punNumberHits = 3;
        const circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");
        const witness = await circuit.calculateWitness(input, true);
        assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]), Fr.e(hash)));
    });

    it("Circuit should have correct number of blows", async function () {
        input.pubGuess = ["3", "0", "2", "0", "1"];
        input.pubNumberBlows = 3;
        const circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");
        const witness = await circuit.calculateWitness(input, true);
        assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]), Fr.e(hash)));

    });

    it("Circuit should have correct number of blows and hits", async function () {
        input.pubGuess = ["1", "0", "2", "0", "3"];
        input.pubNumberBlows = 2;
        input.punNumberHits = 1;
        const circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");
        const witness = await circuit.calculateWitness(input, true);
        assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]), Fr.e(hash)));

    });

    it("Circuit should revert with incorrect number of hits and blows", async function () {
        input.pubGuess = ["1", "0", "2", "0", "3"];
        input.pubNumberBlows = 1;
        input.punNumberHits = 0;
        const circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");

        expect(circuit.calculateWitness(input, true)).to.be.revertedWith(Error)

    });

});