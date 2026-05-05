"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";
import type { Category } from "../types/category";

type State =
  | { status: "loading" }
  | { status: "success"; data: Category[] }
  | { status: "error"; message: string };

type UseCategoriesReturn = {
  state: State;
  create: (name: string) => Promise<void>;
  rename: (id: string, name: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export function useCategories(): UseCategoriesReturn {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const data = await apiFetch<Category[]>("/categories");
      setState({ status: "success", data });
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof Error ? err.message : "Failed to load categories",
      });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const create = useCallback(
    async (name: string) => {
      await apiFetch<Category>("/categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      await load();
    },
    [load],
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      await apiFetch<Category>(`/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      await load();
    },
    [load],
  );

  const remove = useCallback(
    async (id: string) => {
      await apiFetch<void>(`/categories/${id}`, { method: "DELETE" });
      await load();
    },
    [load],
  );

  return { state, create, rename, remove };
}
