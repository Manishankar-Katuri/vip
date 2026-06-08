"use client";

import { useEffect, useState } from "react";

export default function AlertDetailPage(){

const [data,setData]=useState<any>(null);

const [resolved,setResolved]=
useState(false);

useEffect(()=>{

fetch(
"http://localhost:3001/workspace/ba94ea17-4b72-445c-8cb7-26c391768e7d/reviews/alerts/daf8bb92-8ce2-441e-ab31-3f102b9333c4"
)

.then(r=>r.json())

.then(setData)

},[])

if(!data){

return(

<div className="
min-h-screen
bg-[#020617]
text-white
p-10">

Loading...

</div>

)

}

return(

<div className="
min-h-screen
bg-[#020617]
text-white
p-10
">

<h1 className="
text-5xl
font-bold
mb-8">

{data.alert.category.replaceAll(
"_",
" "
)}

</h1>

<div className="
bg-slate-900
rounded-3xl
p-8
mb-6">

<h2 className="
text-2xl
font-bold
mb-4">

AI Recommendation

</h2>

<p>

{data.recommendation}

</p>

</div>

<div className="
bg-slate-900
rounded-3xl
p-8
mb-6">

<h2 className="
text-2xl
font-bold
mb-4">

Suggested Reply

</h2>

<p className="mb-6">

{data.suggestedReply}

</p>

<div className="
flex
gap-4">

<button
className="
bg-green-600
px-5
py-3
rounded-xl
">

Approve Reply

</button>

<button
className="
bg-red-600
px-5
py-3
rounded-xl
">

Reject

</button>

</div>

</div>

<div className="
bg-slate-900
rounded-3xl
p-8
mb-6">

<h2 className="
text-2xl
font-bold
mb-4">

Related Reviews

</h2>

<div className="space-y-4">

{data.reviews.map(
(review:any)=>(

<div
key={review.id}

className="
border
border-slate-700
rounded-xl
p-4
">

<p>

{review.content}

</p>

<p className="
text-gray-400
mt-2">

Rating:
{review.rating}

</p>

</div>

)

)}

</div>

</div>

<div className="
mt-8">

<button

onClick={async()=>{

await fetch(

"http://localhost:3001/workspace/ba94ea17-4b72-445c-8cb7-26c391768e7d/reviews/alerts/daf8bb92-8ce2-441e-ab31-3f102b9333c4/resolve",

{
method:"PATCH"
}

)

setResolved(true)

}}

className="
bg-blue-600
px-6
py-4
rounded-xl
">

Mark Alert Resolved

</button>

{resolved && (

<p className="
text-green-400
mt-4
">

Alert marked resolved

</p>

)}

</div>

</div>

)

}