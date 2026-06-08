"use client";

import { Check, Eye } from "lucide-react";

import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { HospitalRequest } from "@/services/request.service";

type RequestTableProps = {
  requests: HospitalRequest[];
  approvingRequestId?: string;
  onApprove: (requestId: string) => void;
};

const formatCreatedAt = (createdAt: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(createdAt));

const requestDetails = (request: HospitalRequest) => [
  {
    label: "Hospital Name",
    value: request.hospitalName
  },
  {
    label: "Contact Name",
    value: request.contactName
  },
  {
    label: "Email",
    value: request.email
  },
  {
    label: "Website",
    value: request.website || "Not provided"
  },
  {
    label: "Status",
    value: request.status
  },
  {
    label: "Created Date",
    value: formatCreatedAt(request.createdAt)
  }
];

export function RequestTable({
  requests,
  approvingRequestId,
  onApprove
}: RequestTableProps) {
  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-12 text-center text-slate-400">
        No hospital requests yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-800 hover:bg-transparent">
            <TableHead className="px-5 py-4 text-slate-400">
              Hospital Name
            </TableHead>
            <TableHead className="px-5 py-4 text-slate-400">
              Contact Name
            </TableHead>
            <TableHead className="px-5 py-4 text-slate-400">
              Email
            </TableHead>
            <TableHead className="px-5 py-4 text-slate-400">
              Status
            </TableHead>
            <TableHead className="px-5 py-4 text-slate-400">
              CreatedAt
            </TableHead>
            <TableHead className="px-5 py-4 text-right text-slate-400">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const isApproved = request.status === "APPROVED";
            const isApproving = approvingRequestId === request.id;

            return (
              <TableRow
                key={request.id}
                className="border-slate-800 hover:bg-slate-800/50"
              >
                <TableCell className="px-5 py-5 font-medium text-white">
                  {request.hospitalName}
                </TableCell>
                <TableCell className="px-5 py-5 text-slate-300">
                  {request.contactName}
                </TableCell>
                <TableCell className="px-5 py-5 text-slate-300">
                  {request.email}
                </TableCell>
                <TableCell className="px-5 py-5">
                  <StatusBadge status={request.status} />
                </TableCell>
                <TableCell className="px-5 py-5 text-slate-400">
                  {formatCreatedAt(request.createdAt)}
                </TableCell>
                <TableCell className="px-5 py-5">
                  <div className="flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                        >
                          <Eye className="size-3.5" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border border-slate-800 bg-slate-950 p-0 text-white sm:max-w-lg">
                        <DialogHeader className="border-b border-slate-800 px-6 py-5">
                          <DialogTitle className="text-xl text-white">
                            Request Details
                          </DialogTitle>
                          <DialogDescription className="text-slate-400">
                            Hospital setup intake information.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-3 px-6 pb-6">
                          {requestDetails(request).map((detail) => (
                            <div
                              key={detail.label}
                              className="grid gap-1 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-[140px_1fr] sm:gap-4"
                            >
                              <div className="text-sm text-slate-500">
                                {detail.label}
                              </div>
                              <div className="break-words text-sm font-medium text-slate-100">
                                {detail.label === "Status" ? (
                                  <StatusBadge status={request.status} />
                                ) : (
                                  detail.value
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      type="button"
                      size="sm"
                      disabled={isApproved || isApproving}
                      onClick={() => onApprove(request.id)}
                      className="bg-green-600 text-white hover:bg-green-500"
                    >
                      <Check className="size-3.5" />
                      {isApproving ? "Approving" : "Approve"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
