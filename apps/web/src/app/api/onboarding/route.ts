import { NextResponse } from "next/server";

export async function POST(req:Request){

try{

const body=await req.json();

const workspace={

hospitalName:
body.hospitalName,

website:
body.website,

city:
body.city,

specialties:
body.specialties
.split(","),

instagram:
body.instagram,

facebook:
body.facebook,

googleBusinessProfile:
body.googleBusinessProfile

};

return NextResponse.json({

success:true,

workspace

});

}catch(error:any){

return NextResponse.json({

success:false,
error:error.message

})

}

}