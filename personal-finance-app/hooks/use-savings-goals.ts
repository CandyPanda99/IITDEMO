"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: string;
  targetDate: string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  totalContributed: string;
  progressRatio: number;
}

export interface Contribution {
  id: string;
  savingsGoalId: string;
  amount: string;
  date: string;
  createdAt: string;
}

export function useSavingsGoals() {
  return useQuery<SavingsGoal[]>({
    queryKey: ["savings-goals"],
    queryFn: async () => {
      const res = await fetch("/api/savings-goals");
      if (!res.ok) throw new Error("Failed to fetch savings goals");
      return res.json();
    },
  });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      targetAmount: number;
      targetDate?: string;
    }) => {
      const res = await fetch("/api/savings-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create savings goal");
      }
      return res.json() as Promise<SavingsGoal>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Savings goal created");
    },
    onError: (err: Error) => toast.error(typeof err.message === 'string' && err.message.startsWith('{') ? JSON.parse(err.message).formErrors?.[0] || 'An error occurred' : err.message),
  });
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      targetAmount: number;
      targetDate?: string;
    }) => {
      const { id, ...rest } = data;
      const res = await fetch(`/api/savings-goals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rest),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update savings goal");
      }
      return res.json() as Promise<SavingsGoal>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Savings goal updated");
    },
    onError: (err: Error) => toast.error(typeof err.message === 'string' && err.message.startsWith('{') ? JSON.parse(err.message).formErrors?.[0] || 'An error occurred' : err.message),
  });
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/savings-goals/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete savings goal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Savings goal deleted");
    },
    onError: (err: Error) => toast.error(typeof err.message === 'string' && err.message.startsWith('{') ? JSON.parse(err.message).formErrors?.[0] || 'An error occurred' : err.message),
  });
}

export function useAddContribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      goalId: string;
      amount: number;
      date?: string;
    }) => {
      const { goalId, ...rest } = data;
      const res = await fetch(`/api/savings-goals/${goalId}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rest),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to add contribution");
      }
      return res.json() as Promise<Contribution>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Contribution added");
    },
    onError: (err: Error) => toast.error(typeof err.message === 'string' && err.message.startsWith('{') ? JSON.parse(err.message).formErrors?.[0] || 'An error occurred' : err.message),
  });
}
