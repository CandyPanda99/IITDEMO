"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface BudgetCategory {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  category: BudgetCategory;
  monthlyLimit: string;
  createdAt: string;
  updatedAt: string;
  currentSpending: string;
  progressRatio: number;
  state: "GREEN" | "YELLOW" | "RED";
}

export function useBudgets() {
  return useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: async () => {
      const res = await fetch("/api/budgets");
      if (!res.ok) throw new Error("Failed to fetch budgets");
      return res.json();
    },
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { categoryId: string; monthlyLimit: number }) => {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create budget");
      }
      return res.json() as Promise<Budget>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget created");
    },
    onError: (err: Error) => toast.error(typeof err.message === 'string' && err.message.startsWith('{') ? JSON.parse(err.message).formErrors?.[0] || 'An error occurred' : err.message),
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      monthlyLimit,
    }: {
      id: string;
      monthlyLimit: number;
    }) => {
      const res = await fetch(`/api/budgets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyLimit }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update budget");
      }
      return res.json() as Promise<Budget>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget updated");
    },
    onError: (err: Error) => toast.error(typeof err.message === 'string' && err.message.startsWith('{') ? JSON.parse(err.message).formErrors?.[0] || 'An error occurred' : err.message),
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete budget");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget deleted");
    },
    onError: (err: Error) => toast.error(typeof err.message === 'string' && err.message.startsWith('{') ? JSON.parse(err.message).formErrors?.[0] || 'An error occurred' : err.message),
  });
}
