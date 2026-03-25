import { create } from "zustand";

interface TransactionFilters {
  categoryId?: string;
  type?: "INCOME" | "EXPENSE";
  dateFrom?: string;
  dateTo?: string;
}

interface UiStore {
  selectedPeriod: "weekly" | "monthly" | "yearly";
  activeModal: string | null;
  transactionFilters: TransactionFilters;
  setSelectedPeriod: (period: "weekly" | "monthly" | "yearly") => void;
  setActiveModal: (modal: string | null) => void;
  setTransactionFilters: (filters: TransactionFilters) => void;
  clearTransactionFilters: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  selectedPeriod: "monthly",
  activeModal: null,
  transactionFilters: {},
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),
  setActiveModal: (modal) => set({ activeModal: modal }),
  setTransactionFilters: (filters) => set({ transactionFilters: filters }),
  clearTransactionFilters: () => set({ transactionFilters: {} }),
}));
