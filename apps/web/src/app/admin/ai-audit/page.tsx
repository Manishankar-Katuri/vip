"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { PermissionGate } from "@/components/PermissionGate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  apiFetch,
  getAccessToken,
  getSelectedHospitalId
} from "@/lib/api-client";
import { PERMISSIONS } from "@/permissions-core";

type AiAuditLog = {
  id:string;
  hospitalId:string | null;
  userId:string | null;
  roleId:string | null;
  feature:string;
  provider:string;
  model:string;
  promptTokens:number;
  completionTokens:number;
  totalTokens:number;
  estimatedCost:number;
  responseTimeMs:number;
  success:boolean;
  errorMessage:string | null;
  createdAt:string;
  hospital?:{ id:string; name:string } | null;
  user?:{ id:string; email:string; name:string | null; role:string } | null;
};

type Summary = {
  overview:{
    totalCalls:number;
    totalTokens:number;
    totalCost:number;
    averageResponseTime:number;
    failedCalls:number;
  };
  dailyUsage:Array<{ date:string; total:number }>;
  tokenConsumption:Array<{ date:string; total:number }>;
  costTrends:Array<{ date:string; total:number }>;
  featureUsage:Array<{ name:string; total:number }>;
  modelUsage:Array<{ name:string; total:number }>;
  hospitalUsage:Array<{ name:string; total:number }>;
};

type LogsResponse = {
  rows:AiAuditLog[];
  pagination:{
    page:number;
    pageSize:number;
    total:number;
    totalPages:number;
  };
};

type Hospital = {
  id:string;
  name:string;
};

type User = {
  id:string;
  email:string;
  role:string;
};

const emptySummary:Summary = {
  overview:{
    totalCalls:0,
    totalTokens:0,
    totalCost:0,
    averageResponseTime:0,
    failedCalls:0
  },
  dailyUsage:[],
  tokenConsumption:[],
  costTrends:[],
  featureUsage:[],
  modelUsage:[],
  hospitalUsage:[]
};

const emptyLogs:LogsResponse = {
  rows:[],
  pagination:{
    page:1,
    pageSize:25,
    total:0,
    totalPages:0
  }
};

export default function AdminAiAuditPage() {
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [logs, setLogs] = useState<LogsResponse>({
    rows:[],
    pagination:{
      page:1,
      pageSize:25,
      total:0,
      totalPages:0
    }
  });
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [selected, setSelected] = useState<AiAuditLog | null>(null);
  const [filters, setFilters] = useState({
    hospitalId:"",
    userId:"",
    roleId:"",
    feature:"",
    provider:"",
    model:"",
    from:"",
    to:"",
    success:""
  });
  const query = useMemo(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("pageSize", "25");

    return params.toString();
  }, [filters]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!getAccessToken()) {
        setSummary(emptySummary);
        setLogs(emptyLogs);
        setHospitals([]);
        setUsers([]);
        setIsPreview(false);
        return;
      }

      void Promise.all([
        apiFetch<Summary>(`/admin/ai-audit/summary?${query}`),
        apiFetch<LogsResponse>(`/admin/ai-audit/logs?${query}`),
        apiFetch<Hospital[]>("/admin/hospitals"),
        apiFetch<User[]>("/admin/users")
      ])
        .then(([nextSummary, nextLogs, nextHospitals, nextUsers]) => {
          setSummary(nextSummary);
          setLogs(nextLogs);
          setHospitals(nextHospitals);
          setUsers(nextUsers);
          setIsPreview(false);
        })
        .catch(() => {
          setSummary(emptySummary);
          setLogs(emptyLogs);
          setHospitals([]);
          setUsers([]);
          setIsPreview(false);
        });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [query]);

  return (
    <PermissionGate permission={PERMISSIONS.VIEW_AUDIT_LOGS}>
      <section className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">AI Audit Logs</h2>
            <p className="mt-1 text-sm text-slate-600">
              Track AI usage, cost, latency, and failures across VIP.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium" onClick={() => void downloadExport("csv")}>
              Export CSV
            </button>
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium" onClick={() => void downloadExport("xlsx")}>
              Export Excel
            </button>
          </div>
        </div>
        {isPreview ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No live AI audit usage is available for the current session.
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-5">
          <MetricCard label="Total Calls" value={summary.overview.totalCalls.toLocaleString()} />
          <MetricCard label="Total Tokens" value={summary.overview.totalTokens.toLocaleString()} />
          <MetricCard label="Total Cost" value={`$${summary.overview.totalCost.toFixed(4)}`} />
          <MetricCard label="Avg Response" value={`${summary.overview.averageResponseTime} ms`} />
          <MetricCard label="Failed Calls" value={summary.overview.failedCalls.toLocaleString()} tone="danger" />
        </div>

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-4">
          <Select label="Hospital" value={filters.hospitalId} onChange={(hospitalId) => setFilters((current) => ({ ...current, hospitalId }))}>
            <option value="">All hospitals</option>
            {hospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}
          </Select>
          <Select label="User" value={filters.userId} onChange={(userId) => setFilters((current) => ({ ...current, userId }))}>
            <option value="">All users</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.email}</option>)}
          </Select>
          <Select label="Role" value={filters.roleId} onChange={(roleId) => setFilters((current) => ({ ...current, roleId }))}>
            <option value="">All roles</option>
            {["ADMIN", "DOCTOR", "PRODUCTION", "STAFF"].map((role) => <option key={role} value={role}>{role}</option>)}
          </Select>
          <Select label="Status" value={filters.success} onChange={(success) => setFilters((current) => ({ ...current, success }))}>
            <option value="">All statuses</option>
            <option value="true">Success</option>
            <option value="false">Failure</option>
          </Select>
          <Input label="Feature" value={filters.feature} onChange={(feature) => setFilters((current) => ({ ...current, feature }))} />
          <Input label="Provider" value={filters.provider} onChange={(provider) => setFilters((current) => ({ ...current, provider }))} />
          <Input label="Model" value={filters.model} onChange={(model) => setFilters((current) => ({ ...current, model }))} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="From" type="date" value={filters.from} onChange={(from) => setFilters((current) => ({ ...current, from }))} />
            <Input label="To" type="date" value={filters.to} onChange={(to) => setFilters((current) => ({ ...current, to }))} />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ChartPanel title="Daily AI Usage" data={summary.dailyUsage} kind="line" />
          <ChartPanel title="Token Consumption" data={summary.tokenConsumption} kind="line" />
          <ChartPanel title="Cost Trends" data={summary.costTrends} kind="line" />
          <ChartPanel title="Feature Usage" data={summary.featureUsage} kind="bar" />
          <ChartPanel title="Model Usage" data={summary.modelUsage} kind="bar" />
          <ChartPanel title="Hospital Usage" data={summary.hospitalUsage} kind="bar" />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.rows.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{log.hospital?.name ?? log.hospitalId ?? "Global"}</TableCell>
                  <TableCell>{log.user?.email ?? log.userId ?? "System"}</TableCell>
                  <TableCell>{log.feature}</TableCell>
                  <TableCell>{log.model}</TableCell>
                  <TableCell>{log.totalTokens.toLocaleString()}</TableCell>
                  <TableCell>${log.estimatedCost.toFixed(6)}</TableCell>
                  <TableCell>{log.responseTimeMs} ms</TableCell>
                  <TableCell>
                    <span className={log.success ? "text-emerald-700" : "text-rose-700"}>
                      {log.success ? "Success" : "Failed"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button className="text-sm font-medium text-slate-900 underline" onClick={() => setSelected(log)}>
                      View Details
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {logs.rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-sm text-slate-500">
                    No AI audit logs match the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-5 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">AI Call Details</h3>
                  <p className="text-sm text-slate-500">{selected.id}</p>
                </div>
                <button className="rounded-lg border border-slate-200 px-3 py-1 text-sm" onClick={() => setSelected(null)}>
                  Close
                </button>
              </div>
              <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                {[
                  ["Timestamp", new Date(selected.createdAt).toLocaleString()],
                  ["Hospital", selected.hospital?.name ?? selected.hospitalId ?? "Global"],
                  ["User", selected.user?.email ?? selected.userId ?? "System"],
                  ["Role", selected.roleId ?? selected.user?.role ?? "-"],
                  ["Feature", selected.feature],
                  ["Provider", selected.provider],
                  ["Model", selected.model],
                  ["Prompt Tokens", selected.promptTokens.toLocaleString()],
                  ["Completion Tokens", selected.completionTokens.toLocaleString()],
                  ["Total Tokens", selected.totalTokens.toLocaleString()],
                  ["Estimated Cost", `$${selected.estimatedCost.toFixed(6)}`],
                  ["Response Time", `${selected.responseTimeMs} ms`],
                  ["Status", selected.success ? "Success" : "Failed"],
                  ["Error", selected.errorMessage ?? "-"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-200 p-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
                    <dd className="mt-1 break-words text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </section>
    </PermissionGate>
  );

  async function downloadExport(
    format:"csv" | "xlsx"
  ) {
    if (isPreview || !getAccessToken()) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
    const params = new URLSearchParams(query);
    params.delete("pageSize");
    const headers = new Headers();
    const token = getAccessToken();
    const hospitalId = getSelectedHospitalId();

    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (hospitalId) headers.set("x-hospital-id", hospitalId);

    const response = await fetch(`${baseUrl}/admin/ai-audit/export.${format}?${params.toString()}`, {
      headers,
      credentials:"include"
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-audit-logs.${format === "xlsx" ? "xls" : "csv"}`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

function MetricCard({
  label,
  value,
  tone = "default"
}:{
  label:string;
  value:string;
  tone?:"default" | "danger";
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={tone === "danger" ? "mt-2 text-2xl font-semibold text-rose-700" : "mt-2 text-2xl font-semibold text-slate-950"}>
        {value}
      </p>
    </div>
  );
}

function ChartPanel({
  title,
  data,
  kind
}:{
  title:string;
  data:Array<{ date?:string; name?:string; total:number }>;
  kind:"line" | "bar";
}) {
  const xKey = data.some((item) => item.date) ? "date" : "name";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          {kind === "line" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#0f172a" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#0f172a" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text"
}:{
  label:string;
  value:string;
  onChange:(value:string)=>void;
  type?:string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  children
}:{
  label:string;
  value:string;
  onChange:(value:string)=>void;
  children:React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <select
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}
