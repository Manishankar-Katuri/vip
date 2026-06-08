type Snapshot={

date:string;

averageRating:number;

positivePercentage:number;

negativePercentage:number;

reviewCount:number;

};

export function analyzeTrend(
snapshots:Snapshot[]
){

if(snapshots.length<2){

return{

trend:
"Not enough data",

ratingMovement:0,

reviewGrowth:0

};

}

const latest=
snapshots[
snapshots.length-1
];

const previous=
snapshots[
snapshots.length-2
];

const ratingMovement=

latest.averageRating
-
previous.averageRating;

const reviewGrowth=

latest.reviewCount
-
previous.reviewCount;

let trend=
"stable";

if(ratingMovement>0.2){

trend=
"improving";

}

if(ratingMovement<-0.2){

trend=
"declining";

}

return{

trend,

ratingMovement:
ratingMovement
.toFixed(2),

reviewGrowth

};

}