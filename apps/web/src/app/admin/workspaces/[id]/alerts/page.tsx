"use client";

import { useEffect, useState } from "react";

export default function AlertsPage() {

  const [alerts, setAlerts] =
  useState<any[]>([]);

  const workspaceId =
  "ba94ea17-4b72-445c-8cb7-26c391768e7d";

  useEffect(() => {

    fetch(

      `http://localhost:3001/workspace/${workspaceId}/reviews/alerts`

    )
      .then((r) => r.json())
      .then(setAlerts);

  }, []);

  const getSeverityColor = (
    severity:string
  ) => {

    switch(severity){

      case "HIGH":
        return "bg-red-500";

      case "MEDIUM":
        return "bg-yellow-500";

      default:
        return "bg-green-500";

    }

  };

  return (

    <div className="
    min-h-screen
    bg-[#020617]
    text-white
    p-10
    ">

      <div className="mb-10">

        <div className="
        inline-flex
        px-5
        py-2
        rounded-full
        bg-blue-950
        border
        border-blue-800
        ">

          VIP Operations Center

        </div>

        <h1 className="
        text-5xl
        font-bold
        mt-6
        ">

          Review Alerts

        </h1>

        <p className="
        text-gray-400
        mt-3
        ">

          Monitor recurring hospital issues detected by VIP intelligence.

        </p>

      </div>

      <div className="grid gap-6">

        {alerts.map(
          (alert:any)=>(

        <div
        key={alert.id}

        className="
        bg-slate-900
        rounded-3xl
        p-8
        border
        border-slate-700
        shadow-lg
        "

        >

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

              {alert.category.replaceAll(
                "_",
                " "
              )}

              </h2>

              <div className="
              mt-4
              space-y-2
              ">

              <p className="
              text-gray-400
              ">

              Count:

              <span className="
              ml-2
              text-white
              font-semibold
              ">

              {alert.count}

              </span>

              </p>

              <p className="
              text-gray-400
              ">

              Status:

              <span className="
              ml-2
              text-green-400
              font-semibold
              ">

              {alert.status}

              </span>

              </p>

              </div>

            </div>

            <div className="
            text-right
            ">

            <div
            className={`
            px-4
            py-2
            rounded-full
            text-black
            font-bold
            ${getSeverityColor(
              alert.severity
            )}
            `}
            >

            {alert.severity}

            </div>

            <a

            href={

            `/admin/workspaces/${workspaceId}/alerts/${alert.id}`

            }

            className="
            mt-6
            inline-block
            bg-blue-600
            hover:bg-blue-500
            px-5
            py-2
            rounded-xl
            "

            >

            View Action

            </a>

            </div>

          </div>

        </div>

        ))}

      </div>

    </div>

  );

}