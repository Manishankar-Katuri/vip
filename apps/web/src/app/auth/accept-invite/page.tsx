"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";

type InvitationPreview = {
  email:string;
  role:string;
  hospitalId:string | null;
  isGlobal:boolean;
  expiresAt:string;
};

type LoginResponse = {
  accessToken:string;
  redirectTo:string;
};

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<AcceptInviteShell state="loading" />}>
      <AcceptInviteContent />
    </Suspense>
  );
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [state, setState] =
    useState<"loading" | "ready" | "success" | "error">("loading");
  const [invitation, setInvitation] =
    useState<InvitationPreview | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setMessage("Invitation token is missing.");
      setState("error");
      return;
    }

    void apiFetch<InvitationPreview>("/auth/accept-invite", {
      method:"POST",
      body:JSON.stringify({ token })
    })
      .then((preview) => {
        setInvitation(preview);
        setState("ready");
      })
      .catch(() => {
        setMessage("Invitation is invalid, expired, or revoked.");
        setState("error");
      });
  }, [token]);

  async function submit() {
    try {
      const response = await apiFetch<LoginResponse>("/auth/set-password", {
        method:"POST",
        body:JSON.stringify({
          token,
          name,
          password
        })
      });

      window.localStorage.setItem(
        "vip_access_token",
        response.accessToken
      );
      setState("success");
      setTimeout(() => router.push(response.redirectTo), 800);
    } catch {
      setMessage("Could not set password. Use at least 8 characters.");
      setState("error");
    }
  }

  if (state !== "ready" || !invitation) {
    return (
      <AcceptInviteShell
        state={state}
        message={message}
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Set your VIP password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Invitation for {invitation.email} as {invitation.role}.
        </p>
        <div className="mt-6 grid gap-3">
          <Input
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button onClick={submit}>
            Set password
          </Button>
        </div>
      </section>
    </main>
  );
}

function AcceptInviteShell({
  state,
  message
}:{
  state:"loading" | "ready" | "success" | "error";
  message?:string;
}) {
  const isSuccess = state === "success";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">
          {isSuccess
            ? "Invitation accepted"
            : state === "error"
              ? "Invitation unavailable"
              : "Checking invitation"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {isSuccess
            ? "Your account is active. Redirecting you now."
            : message ?? "Please wait while VIP validates your invitation."}
        </p>
      </section>
    </main>
  );
}
