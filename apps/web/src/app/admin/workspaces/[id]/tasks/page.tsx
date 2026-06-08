"use client";

import { useEffect, useState } from "react";

type Task = {
title:string;
priority:"HIGH"|"MEDIUM";
};

type Alert = {
category:string;
};

export default function TasksPage(){

const [tasks,setTasks]=
useState<Task[]>([]);

async function loadTasks():Promise<Task[]>{

const res=
await fetch(
"http://localhost:3001/workspace/ba94ea17-4b72-445c-8cb7-26c391768e7d/reviews/alerts"
);

const alerts=
await res.json();

const generated:Task[]=[];

(alerts as Alert[]).forEach(
(alert)=>{

if(
alert.category==="STAFF_BEHAVIOR"
){

generated.push({

title:
"Schedule staff communication training",

priority:
"HIGH"

});

generated.push({

title:
"Review receptionist interaction workflow",

priority:
"MEDIUM"

});

}

if(
alert.category==="WAIT_TIME"
){

generated.push({

title:
"Audit appointment scheduling",

priority:
"HIGH"

});

}

}

)

return generated

}

useEffect(()=>{

let cancelled=false;

loadTasks().then((generated)=>{
if(!cancelled){
setTasks(
generated
)
}
})

return()=>{
cancelled=true;
}

},[])

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

AI Action Tasks

</h1>

<div className="
space-y-5
">

{tasks.map(
(task,index)=>(

<div
key={index}

className="
bg-slate-900
rounded-2xl
p-6
border
border-slate-700
flex
justify-between
">

<div>

<h2 className="
font-bold
text-xl">

□ {task.title}

</h2>

</div>

<div>

<span className="
px-4
py-2
rounded-full
bg-red-600
">

{task.priority}

</span>

</div>

</div>

)

)}

</div>

</div>

)

}
