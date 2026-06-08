"use client";

const activity = [
  "Alert resolved: STAFF_BEHAVIOR",
  "3 new reviews analyzed",
  "Health score increased",
  "AI generated 2 action tasks"
];

const metrics = [
  {name:"Patient Satisfaction",score:92},
  {name:"Staff Performance",score:68},
  {name:"Appointment Flow",score:81},
  {name:"Response Quality",score:95}
];

export default function WarRoom(){

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

VIP War Room

</h1>

<div className="
grid
grid-cols-2
gap-8
">

<div className="
bg-slate-900
rounded-3xl
p-8
">

<h2 className="
text-2xl
font-bold
mb-6
">

KPI Heatmap

</h2>

<div className="space-y-4">

{metrics.map(
(item,index)=>(

<div key={index}>

<div className="
flex
justify-between
mb-2
">

<span>{item.name}</span>

<span>{item.score}%</span>

</div>

<div className="
w-full
bg-slate-800
rounded-full
h-5
">

<div

style={{
width:
`${item.score}%`
}}

className="
bg-blue-600
h-5
rounded-full
"

></div>

</div>

</div>

)

)}

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
mb-6
">

Recent Activity

</h2>

<div className="
space-y-4
">

{activity.map(
(item,index)=>(

<div
key={index}

className="
bg-slate-800
rounded-xl
p-4
">

{item}

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
mt-8
">

<h2 className="
text-2xl
font-bold
mb-6
">

Quick Actions

</h2>

<div className="
flex
gap-4
">

<button className="
bg-blue-600
px-5
py-3
rounded-xl">

Generate Report

</button>

<button className="
bg-green-600
px-5
py-3
rounded-xl">

Review Alerts

</button>

<button className="
bg-purple-600
px-5
py-3
rounded-xl">

Open Copilot

</button>

</div>

</div>

</div>

)

}