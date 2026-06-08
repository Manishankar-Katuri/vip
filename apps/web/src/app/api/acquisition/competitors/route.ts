import {NextResponse}
from "next/server";

import {
findCompetitors
}
from "@/lib/acquisition/places";

export async function POST(
req:Request
){

try{

const body=
await req.json();

const competitors=
await findCompetitors(

body.hospitalName,

body.city,

body.specialization

);

return NextResponse.json({

success:true,

competitors

});

} catch (error: unknown) {

return NextResponse.json({

success:false,
error: error instanceof Error ? error.message : "Competitor search failed."

});

}

}
