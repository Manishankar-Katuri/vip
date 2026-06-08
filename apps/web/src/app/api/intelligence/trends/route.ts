import {
NextResponse
}
from "next/server";

import {
analyzeTrend
}
from "@/lib/intelligence/trend-intelligence";

export async function GET(){

try{

/*
Temporary snapshots.

Later:
DB historical snapshots
*/

const snapshots=[

{
date:"2026-05-01",
averageRating:4.1,
positivePercentage:72,
negativePercentage:12,
reviewCount:120
},

{
date:"2026-05-21",
averageRating:4.5,
positivePercentage:81,
negativePercentage:8,
reviewCount:164
}

];

const trend=
analyzeTrend(
snapshots
);

return NextResponse.json({

success:true,

trend

});

}catch(error:any){

return NextResponse.json({

success:false,
error:error.message

});

}

}