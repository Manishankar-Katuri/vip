"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { RequestTable } from "@/components/admin/RequestTable";
import {
  approveHospitalRequest,
  getHospitalRequests,
  type HospitalRequest
} from "@/services/request.service";

const hospitalRequestsQueryKey = ["hospital-requests"];

export default function AdminRequestsPage() {
  const queryClient = useQueryClient();

  const {
    data: requests = [],
    isLoading,
    isError
  } = useQuery({
    queryKey: hospitalRequestsQueryKey,
    queryFn: getHospitalRequests
  });

  const approveMutation = useMutation({
    mutationFn: approveHospitalRequest,
    onMutate: async (requestId) => {
      await queryClient.cancelQueries({
        queryKey: hospitalRequestsQueryKey
      });

      const previousRequests =
        queryClient.getQueryData<HospitalRequest[]>(
          hospitalRequestsQueryKey
        );

      queryClient.setQueryData<HospitalRequest[]>(
        hospitalRequestsQueryKey,
        (currentRequests = []) =>
          currentRequests.map((request) =>
            request.id === requestId
              ? {
                  ...request,
                  status: "APPROVED"
                }
              : request
          )
      );

      return {
        previousRequests
      };
    },
    onError: (_error, _requestId, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(
          hospitalRequestsQueryKey,
          context.previousRequests
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: hospitalRequestsQueryKey
      });
    }
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="mb-10 flex flex-col gap-4 border-b border-slate-800 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-blue-400">
              VIP Admin
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              Hospital Requests
            </h1>
            <p className="mt-3 text-slate-400">
              Review incoming setup requests from hospitals.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <div className="text-sm text-slate-400">Total Requests</div>
            <div className="mt-1 text-3xl font-bold">
              {isLoading ? "..." : requests.length}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-5 h-6 w-44 animate-pulse rounded bg-slate-800" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 animate-pulse rounded-xl bg-slate-800"
                />
              ))}
            </div>
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-red-900/60 bg-red-950/40 px-6 py-5 text-red-200">
            Failed to load hospital requests.
          </div>
        )}

        {!isLoading && !isError && (
          <RequestTable
            requests={requests}
            approvingRequestId={
              approveMutation.isPending
                ? approveMutation.variables
                : undefined
            }
            onApprove={approveMutation.mutate}
          />
        )}
      </div>
    </main>
  );
}
