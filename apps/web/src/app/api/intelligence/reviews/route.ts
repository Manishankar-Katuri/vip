import {
NextResponse
}
from "next/server";

import {
getReviews
}
from "@/lib/knowledge/review-store";

import {
analyzeReviews
}
from "@/lib/intelligence/review-analytics";

export async function GET(
req:Request
){

try{

const url=
new URL(req.url);

const hospital=
url.searchParams.get(
"hospital"
);

const reviews=
getReviews(
hospital || ""
);

const analytics=
analyzeReviews(
reviews
);

return NextResponse.json({

success:true,

analytics

});

}catch(error: unknown){

return NextResponse.json({

success:false,
error:error instanceof Error ? error.message : "Review intelligence request failed."

})

}

}
