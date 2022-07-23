pragma circom 2.0.0;

// [assignment] implement a variation of mastermind from https://en.wikipedia.org/wiki/Mastermind_(board_game)#Variation as a circuit

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";

//varitaion that allows for different code size and code possibilities
template MastermindVariation(n, m) {

    signal input pubGuess[n];
    signal input punNumberHits;
    signal input pubNumberBlows;
    signal input pubHash;

    //private
    signal input solution[n];
    signal input salt;

    //Output
    signal output solutionHash;

    component lessThan[2*n];
    var k = 0; 
    var j = 0;

    for(var i = 0; i < n; i++){
        lessThan[i] = LessThan(5);
        lessThan[i].in[0] <== pubGuess[i];
        lessThan[i].in[1] <== m;
        lessThan[i].out === 1;
        lessThan[i+n] = LessThan(5);
        lessThan[i+n].in[0] <== solution[i];
        lessThan[i+n].in[1] <== m;
        lessThan[i+n].out === 1;
    }

    // Count hit & blow
    var hit = 0;
    var blow = 0;
    component equalHB[n*n];

    for (j=0; j<n; j++) {
        for (k=0; k<n; k++) {
            equalHB[n*j+k] = IsEqual();
            equalHB[n*j+k].in[0] <== solution[j];
            equalHB[n*j+k].in[1] <== pubGuess[k];
            blow += equalHB[n*j+k].out;
            if (j == k) {
                hit += equalHB[n*j+k].out;
                blow -= equalHB[n*j+k].out;
            }
        }
    }

     // Create a constraint around the number of hit
    component equalHit = IsEqual();
    equalHit.in[0] <== punNumberHits;
    equalHit.in[1] <== hit;
    equalHit.out === 1;
    
    // Create a constraint around the number of blow
    component equalBlow = IsEqual();
    equalBlow.in[0] <== pubNumberBlows;
    equalBlow.in[1] <== blow;
    equalBlow.out === 1;

    component poseidon = Poseidon(n+1);
    poseidon.inputs[0] <== salt;
    for (var i = 0; i< n ; i++){
        poseidon.inputs[i+1] <==  solution[i];
    }
    solutionHash <== poseidon.out;
    pubHash === solutionHash;

}

component main {public[pubGuess, punNumberHits, pubNumberBlows, pubHash]} = MastermindVariation(5,10);