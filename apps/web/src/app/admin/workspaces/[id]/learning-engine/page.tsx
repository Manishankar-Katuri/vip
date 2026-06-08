"use client";

const learnings=[

{
signal:
"Doctor educational reels",

engagement:"+48%",

action:
"Increase doctor-led content"
},

{
signal:
"Long text posts",

engagement:"-21%",

action:
"Shift toward reels and carousels"
},

{
signal:
"Heart health campaign",

engagement:"+63%",

action:
"Expand into weekly health awareness series"
},

{
signal:
"Patient success stories",

engagement:"+34%",

action:
"Increase trust-building content"
}

]

export default function LearningEngine(){

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

VIP Learning Engine

</h1>

<p className="
text-gray-400
mb-8
">

AI continuously learns from social performance and updates future strategy automatically.

</p>

<div className="
space-y-6
">

{learnings.map(
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
mb-4
">

<h2 className="
text-xl
font-bold
">

{item.signal}

</h2>

<div className="
bg-green-600
px-4
py-2
rounded-full
">

{item.engagement}

</div>

</div>

<p className="
text-gray-300
">

AI Decision:

{item.action}

</p>

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

Next Strategy Update

</h2>

<p>

Increase educational doctor content by 40%, reduce long-form posts, and prioritize preventive care campaigns.

</p>

</div>

</div>

)

}