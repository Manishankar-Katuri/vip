"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  hospitalRequestSchema,
  HospitalRequestForm
} from "@/lib/request-schema";

import {
  submitHospitalRequest
} from "@/services/request.service";

export default function RequestSetupPage() {

  const [success,setSuccess]=
  useState(false);

  const [loading,setLoading]=
  useState(false);

  const {

    register,

    handleSubmit,

    reset,

    formState:{errors}

  }=

  useForm<HospitalRequestForm>({

    resolver:

    zodResolver(
      hospitalRequestSchema
    )

  });

  const onSubmit=
  async(
  data:HospitalRequestForm
  )=>{

    try{

      setLoading(true)

      await submitHospitalRequest(
      data
      )

      setSuccess(true)

      reset()

    }

    catch{

      alert(
      "Failed to submit"
      )

    }

    finally{

      setLoading(false)

    }

  };

return(

<main className="min-h-screen bg-slate-950 text-white">

<div className="max-w-7xl mx-auto px-8 py-20">

<div className="text-center mb-16">

<div className="inline-flex px-4 py-2 rounded-full bg-slate-900 border border-slate-800 mb-6 text-sm text-blue-400">

VIP Intelligence Platform

</div>

<h1 className="text-6xl font-bold mb-6">

Request Hospital Setup

</h1>

<p className="text-slate-400">

Our team configures everything.

</p>

</div>

<div className="grid lg:grid-cols-2 gap-8">

<div className="bg-slate-900 rounded-3xl p-8">

<h2 className="text-3xl mb-8">

What VIP unlocks

</h2>

<div className="space-y-4">

<div>AI Growth Intelligence</div>

<div>Competitor Tracking</div>

<div>Content Intelligence</div>

<div>Patient Insights</div>

</div>

</div>

<div className="bg-slate-900 rounded-3xl p-8">

<form
onSubmit={handleSubmit(onSubmit)}
className="space-y-5"
>

<div>

<input
placeholder="Hospital Name"
{...register("hospitalName")}
className="w-full h-14 px-5 rounded-xl bg-slate-800"
/>

<p className="text-red-400 text-sm">

{errors.hospitalName?.message}

</p>

</div>


<div>

<input
placeholder="Contact Name"
{...register("contactName")}
className="w-full h-14 px-5 rounded-xl bg-slate-800"
/>

<p className="text-red-400 text-sm">

{errors.contactName?.message}

</p>

</div>


<div>

<input
placeholder="Email"
{...register("email")}
className="w-full h-14 px-5 rounded-xl bg-slate-800"
/>

<p className="text-red-400 text-sm">

{errors.email?.message}

</p>

</div>


<input
placeholder="Website"
{...register("website")}
className="w-full h-14 px-5 rounded-xl bg-slate-800"
/>


<button
disabled={loading}
className="w-full h-14 rounded-xl bg-blue-600"
>

{loading
? "Submitting..."
: "Submit Request"}

</button>

</form>


{
success && (

<div className="mt-6 rounded-xl border border-green-700 bg-green-950 p-4">

Request submitted successfully

</div>

)
}

</div>

</div>

</div>

</main>

)

}