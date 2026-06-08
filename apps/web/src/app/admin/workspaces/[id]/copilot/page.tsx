"use client";

import { useState } from "react";

export default function CopilotPage(){

const [question,setQuestion]=
useState("");

const [answer,setAnswer]=
useState("");

async function ask(){

const res=
await fetch(

"http://localhost:3001/workspace/ba94ea17-4b72-445c-8cb7-26c391768e7d/reviews/dashboard"

);

const data=
await res.json();

if(
question.toLowerCase()
.includes("improve")
){

setAnswer(

`Hospital Health Score: ${data.healthScore}/100

Main concerns:

${data.topIssues
.map(
(i:any)=>i.category
)
.join(", ")}

Recommended actions:

• Staff communication training

• Improve scheduling

• Monitor recurring complaints`

)

return;

}

setAnswer(

data.summary

)

}

return(

<div className="
min-h-screen
bg-[#020617]
text-white
p-10">

<h1 className="
text-5xl
font-bold
mb-6">

VIP AI Copilot

</h1>

<div className="
bg-slate-900
rounded-3xl
p-8">

<input

value={question}

onChange={(e)=>
setQuestion(
e.target.value
)
}

placeholder=
"Ask: What should we improve?"

className="
w-full
p-4
rounded-xl
bg-slate-800
mb-4
"
/>

<button

onClick={ask}

className="
bg-blue-600
px-6
py-3
rounded-xl"

>

Ask AI

</button>

<div className="
mt-8
whitespace-pre-wrap">

{answer}

</div>

</div>

</div>

)

}