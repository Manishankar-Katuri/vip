"use client";

import Link from "next/link";
import {
LayoutDashboard,
ShieldAlert,
Brain,
Users
} from "lucide-react";

export default function VipLayout({
children,
}:{
children:React.ReactNode
}){

const menu=[

{
name:"Dashboard",
icon:<LayoutDashboard size={20}/>,
href:"/admin/workspaces/ba94ea17-4b72-445c-8cb7-26c391768e7d/dashboard"
},

{
name:"Reputation",
icon:<ShieldAlert size={20}/>,
href:"/admin/workspaces/ba94ea17-4b72-445c-8cb7-26c391768e7d/reputation"
},

{
name:"Competitors",
icon:<Users size={20}/>,
href:"/admin/workspaces/ba94ea17-4b72-445c-8cb7-26c391768e7d/competitor-intelligence"
},

{
name:"Brand Memory",
icon:<Brain size={20}/>,
href:"/admin/workspaces/ba94ea17-4b72-445c-8cb7-26c391768e7d/memory"
}

];

return(

<div className="
min-h-screen
flex
bg-[#0B1120]
text-white
">

<aside className="
w-[260px]
bg-[#111827]
border-r
border-slate-800
p-6
">

<div className="mb-12">

<h1 className="
text-4xl
font-black
text-cyan-400
">

VIP

</h1>

<p className="
text-slate-400
text-sm
mt-2
">

AI Growth OS

</p>

</div>

<div className="space-y-2">

{menu.map(item=>(

<Link
key={item.name}
href={item.href}
>

<div className="
flex
items-center
gap-3
px-4
py-4
rounded-xl
hover:bg-slate-800
transition
cursor-pointer
">

{item.icon}

<span className="
text-slate-200
">

{item.name}

</span>

</div>

</Link>

))}

</div>

</aside>

<div className="flex-1 p-8">

<div className="
bg-[#131c31]
rounded-2xl
p-5
flex
justify-between
items-center
mb-8
">

<div>

<h2 className="
text-xl
font-bold
">

Dr Harika ENT

</h2>

<p className="
text-slate-400
">

Healthcare Intelligence Dashboard

</p>

</div>

<div className="
bg-cyan-500
text-black
px-4
py-2
rounded-full
font-semibold
">

LIVE AI

</div>

</div>

{children}

</div>

</div>

)

}
