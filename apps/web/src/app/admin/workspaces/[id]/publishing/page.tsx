"use client";

const queue=[

{
title:"Heart Health Myth vs Fact",
platform:"Instagram Reel",
status:"Awaiting Approval",
date:"Tomorrow • 10:00 AM"
},

{
title:"Meet Our Cardiology Team",
platform:"LinkedIn Carousel",
status:"Scheduled",
date:"Wednesday • 2:00 PM"
},

{
title:"Patient Recovery Story",
platform:"Facebook Post",
status:"Draft Generated",
date:"Friday • 11:00 AM"
}

]

export default function PublishingPage(){

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
mb-8
">

VIP Publishing Pipeline

</h1>

<p className="
text-gray-400
mb-8
">

AI generated, planned and scheduled content pipeline.

</p>

<div className="
space-y-6
">

{queue.map(
(item,index)=>(

<div
key={index}

className="
bg-slate-900
rounded-3xl
p-8
border
border-slate-700
">

<div className="
flex
justify-between
items-center
">

<div>

<h2 className="
text-2xl
font-bold
">

{item.title}

</h2>

<p className="
text-gray-400
mt-2
">

{item.platform}

</p>

<p className="
text-blue-400
mt-3
">

{item.date}

</p>

</div>

<div className="
text-right
">

<div className="
bg-yellow-600
px-4
py-2
rounded-full
mb-4
">

{item.status}

</div>

<div className="
flex
gap-3
">

<button className="
bg-green-600
px-4
py-2
rounded-xl
">

Approve

</button>

<button className="
bg-red-600
px-4
py-2
rounded-xl
">

Edit

</button>

</div>

</div>

</div>

</div>

)

)}

</div>

<div className="
bg-slate-900
rounded-3xl
p-8
mt-8
">

<h2 className="
text-2xl
font-bold
mb-4
">

Autonomous Agent Decision

</h2>

<p>

Doctor educational reels are outperforming text posts by 48%.
VIP moved two additional doctor-led posts into next week&apos;s publishing schedule.

</p>

</div>

</div>

)

}
