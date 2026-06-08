"use client";

const memory={

tone:"Professional + caring + educational",

audience:
"Adults 35–65, families, senior citizens",

specialties:[
"Cardiology",
"General Medicine",
"Orthopedics"
],

contentStyle:
"Short educational reels + trust building stories"

}

const trends=[

"Heart Health Awareness",

"Summer Hydration Tips",

"Diabetes Prevention",

"Senior Wellness"

]

const plan=[

{
day:"Monday",
topic:"Heart health myth vs fact",
format:"Instagram Reel"
},

{
day:"Wednesday",
topic:"Doctor educational tip",
format:"LinkedIn Carousel"
},

{
day:"Friday",
topic:"Patient success story",
format:"Facebook Post"
},

{
day:"Sunday",
topic:"Preventive care awareness",
format:"Short video"
}

]

export default function SocialAgent(){

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

VIP Autonomous Social Agent

</h1>

<div className="
grid
grid-cols-2
gap-6
mb-8
">

<div className="
bg-slate-900
rounded-3xl
p-8">

<h2 className="
text-2xl
font-bold
mb-4">

Brand Memory

</h2>

<p>
Tone:
{memory.tone}
</p>

<p className="mt-3">
Audience:
{memory.audience}
</p>

<p className="mt-3">
Style:
{memory.contentStyle}
</p>

</div>

<div className="
bg-slate-900
rounded-3xl
p-8">

<h2 className="
text-2xl
font-bold
mb-4">

Healthcare Trends

</h2>

<div className="space-y-3">

{trends.map(
(item,index)=>(

<div
key={index}

className="
bg-slate-800
rounded-xl
p-3
">

🔥 {item}

</div>

)

)}

</div>

</div>

</div>

<div className="
bg-slate-900
rounded-3xl
p-8
">

<h2 className="
text-2xl
font-bold
mb-6">

AI Weekly Content Planner

</h2>

<div className="
space-y-4
">

{plan.map(
(item,index)=>(

<div
key={index}

className="
border
border-slate-700
rounded-xl
p-5
flex
justify-between
">

<div>

<h3 className="
font-bold
text-lg">

{item.day}

</h3>

<p>

{item.topic}

</p>

</div>

<div>

{item.format}

</div>

</div>

)

)}

</div>

</div>

</div>

)

}