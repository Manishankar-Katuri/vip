"use client";

import {useState} from "react";

export default function Onboarding(){

const[data,setData]=
useState<any>(null);

const form={
hospitalName:"",
website:"",
city:"",
specialties:"",
instagram:"",
facebook:"",
googleBusinessProfile:""
};

const[input,setInput]=
useState(form);

async function createWorkspace(){

const res=
await fetch(
"/api/onboarding",
{
method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify(
input
)

}
);

const result=
await res.json();

setData(
result.workspace
);

}

return(

<div className="p-10 max-w-4xl mx-auto space-y-4">

<h1 className="text-3xl font-bold">
VIP Hospital Onboarding
</h1>

{Object.keys(input).map(
(field)=>(

<input

key={field}

className=
"border p-3 rounded w-full"

placeholder={field}

value={
(input as any)[field]
}

onChange={(e)=>

setInput({

...input,

[field]:
e.target.value

})

}

/>

)

)}

<button

onClick={
createWorkspace
}

className=
"bg-black text-white px-6 py-3 rounded"

>

Create Workspace

</button>

{data && (

<pre
className=
"bg-gray-100 p-5 rounded"
>

{JSON.stringify(
data,
null,
2
)}

</pre>

)}

</div>

)

}