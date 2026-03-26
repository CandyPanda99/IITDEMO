"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface TransactionFilters {
  categoryId?: string;
  type?: "INCOME" | "EXPENSE";
  dateFrom?: string;
  dateTo?: string;
}

export interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  currency: string;
  categoryId: string;
  category: { id: string; name: string };
  date: string;
  notes?: string | null;
  isRecurring: boolean;
  recurringFrequency?: "WEEKLY" | "MONTHLY" | "YEARLY" | null;
  recurringNextDate?: string | null;
  recurringParentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.categoryId) params.set("categoryId", filters.categoryId);
      if (filters?.type) params.set("type", filters.type);
      if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.set("dateTo", filters.dateTo);
      const qs = params.toString();
      const res = await fetch(`/api/transactions${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json() as Promise<Transaction[]>;
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create transaction");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update transaction");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to delete transaction");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
