export function cosineSimilarity(
vectorA:number[],
vectorB:number[]
){

let dotProduct =
0;

let magnitudeA =
0;

let magnitudeB =
0;

const length =
Math.min(
vectorA.length,
vectorB.length
)

for(
let index = 0;
index < length;
index = index + 1
){

const valueA =
vectorA[index];

const valueB =
vectorB[index];

dotProduct =
dotProduct + valueA * valueB;

magnitudeA =
magnitudeA + valueA * valueA;

magnitudeB =
magnitudeB + valueB * valueB;

}

if(
magnitudeA === 0 ||
magnitudeB === 0
){

return 0;

}

return dotProduct /
(
Math.sqrt(magnitudeA) *
Math.sqrt(magnitudeB)
)

}
