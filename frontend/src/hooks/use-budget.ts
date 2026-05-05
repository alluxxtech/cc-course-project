"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";
import type { BudgetResponse } from "../types/budget";

type BudgetState =
  | { status: "loading" }
  | { status: "success"; data: BudgetResponse }
  | { status: "error"; message: string };

type UseBudgetReturn = {
  state: BudgetState;
  reload: () => Promise<void>;
  setBudget: (amount: number) => Promise<void>;
};

export function useBudget(year: number, month: number): UseBudgetReturn {
  const [state, setState] = useState<BudgetState>({ status: "loading" });

  const reload = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const data = await apiFetch<BudgetResponse>(`/budgets/${year}/${month}`);
      setState({ status: "success", data });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to load budget",
      });
    }
  }, [year, month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  const setBudget = useCallback(
    async (amount: number) => {
      await apiFetch<void>(`/budgets/${year}/${month}`, {
        method: "PUT",
        body: JSON.stringify({ amount }),
      });
      await reload();
    },
    [year, month, reload],
  );

  return { state, reload, setBudget };
}
