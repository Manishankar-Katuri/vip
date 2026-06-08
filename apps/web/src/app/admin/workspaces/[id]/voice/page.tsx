"use client";

import { useState } from "react";

export default function VoicePage() {

  const [text, setText] =
  useState("");

  const [response, setResponse] =
  useState("");

  const [listening, setListening] =
  useState(false);

  async function startListening() {

    const SpeechRecognition:any =

      (window as any)
      .webkitSpeechRecognition ||

      (window as any)
      .SpeechRecognition;

    if (!SpeechRecognition) {

      alert(
        "Speech recognition not supported in this browser. Try Chrome."
      );

      return;

    }

    const recognition =
    new SpeechRecognition();

    recognition.lang="en-US";

    recognition.continuous=false;

    recognition.interimResults=false;

    setListening(true);

    recognition.start();

    recognition.onresult=
    async(event:any)=>{

      const transcript=

      event.results[0][0]
      .transcript;

      setText(
        transcript
      );

      try{

        const res=

        await fetch(

        "http://localhost:3001/workspace/ba94ea17-4b72-445c-8cb7-26c391768e7d/reviews/dashboard"

        );

        const data=
        await res.json();

        if(

        transcript
        .toLowerCase()
        .includes("issue")

        ){

          setResponse(

`Main issue:
${data.topIssues[0]?.category || "None"}

Health Score:
${data.healthScore}/100

Summary:
${data.summary}`

          );

        } else {

          setResponse(

`You said:

${transcript}

VIP assistant ready.`

          );

        }

      }

      catch{

        setResponse(
          "Error loading dashboard data"
        );

      }

      setListening(false);

    };

    recognition.onerror=
    ()=>{

      setResponse(
        "Microphone error"
      );

      setListening(false);

    };

    recognition.onend=
    ()=>{

      setListening(false);

    };

  }

  return (

    <div className="
    min-h-screen
    bg-[#020617]
    text-white
    p-10">

      <h1 className="
      text-5xl
      font-bold
      mb-8">

        VIP Voice Assistant

      </h1>

      <div className="
      bg-slate-900
      rounded-3xl
      p-10
      text-center">

        <button

        onClick={
          startListening
        }

        className={`
        w-36
        h-36
        rounded-full
        text-5xl
        transition

        ${listening
        ? "bg-red-600 animate-pulse"
        : "bg-blue-600"}
        `}

        >

          🎤

        </button>

        <p className="
        mt-6
        text-gray-400">

          {listening
          ? "Listening..."
          : "Tap microphone"}

        </p>

        <div className="
        mt-10
        bg-slate-800
        rounded-xl
        p-6">

          <h2 className="
          text-xl
          font-bold
          mb-4">

            Transcript

          </h2>

          <p>

            {text}

          </p>

        </div>

        <div className="
        mt-6
        bg-slate-800
        rounded-xl
        p-6
        whitespace-pre-wrap">

          <h2 className="
          text-xl
          font-bold
          mb-4">

            VIP Response

          </h2>

          {response}

        </div>

      </div>

    </div>

  );

}
