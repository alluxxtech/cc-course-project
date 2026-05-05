"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";
import type { Transaction, TransactionFilters } from "../types/transaction";

type CreatePayload = {
  title: string;
  amount: number;
  currency: string;
  date: string;
  categoryId: string;
  notes?: string;
};

type UpdatePayload = Partial<CreatePayload>;

type State =
  | { status: "loading" }
  | { status: "success"; data: Transaction[] }
  | { status: "error"; message: string };

type UseTransactionsReturn = {
  state: State;
  reload: () => void;
  create: (payload: CreatePayload) => Promise<void>;
  update: (id: string, payload: UpdatePayload) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export function useTransactions(
  filters: TransactionFilters,
): UseTransactionsReturn {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.preset) {
        params.set("preset", filters.preset);
      } else {
        if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.set("dateTo", filters.dateTo);
      }
      if (filters.amountMin) params.set("amountMin", filters.amountMin);
      if (filters.amountMax) params.set("amountMax", filters.amountMax);

      const qs = params.toString();
      const data = await apiFetch<Transaction[]>(
        `/transactions${qs ? `?${qs}` : ""}`,
      );
      setState({ status: "success", data });
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof Error ? err.message : "Failed to load transactions",
      });
    }
  }, [
    filters.search,
    filters.categoryId,
    filters.preset,
    filters.dateFrom,
    filters.dateTo,
    filters.amountMin,
    filters.amountMax,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const create = useCallback(
    async (payload: CreatePayload) => {
      await apiFetch<Transaction>("/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await load();
    },
    [load],
  );

  const update = useCallback(
    async (id: string, payload: UpdatePayload) => {
      await apiFetch<Transaction>(`/transactions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await load();
    },
    [load],
  );

  const remove = useCallback(
    async (id: string) => {
      await apiFetch<void>(`/transactions/${id}`, { method: "DELETE" });
      await load();
    },
    [load],
  );

  return { state, reload: load, create, update, remove };
}
