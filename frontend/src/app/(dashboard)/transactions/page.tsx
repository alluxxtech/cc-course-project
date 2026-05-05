"use client";

import { useState, useCallback } from "react";
import { useTransactions } from "../../../hooks/use-transactions";
import { useCategories } from "../../../hooks/use-categories";
import { useDebounce } from "../../../hooks/use-debounce";
import type {
  Transaction,
  TransactionFilters,
} from "../../../types/transaction";
import type { Category } from "../../../types/category";

const EMPTY_FILTERS: TransactionFilters = {
  search: "",
  categoryId: "",
  preset: "",
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
};

const CURRENCIES = ["USD", "EUR", "GBP", "UAH", "PLN"];

export default function TransactionsPage() {
  const [rawSearch, setRawSearch] = useState("");
  const [filters, setFilters] = useState<Omit<TransactionFilters, "search">>(
    () => ({
      categoryId: EMPTY_FILTERS.categoryId,
      preset: EMPTY_FILTERS.preset,
      dateFrom: EMPTY_FILTERS.dateFrom,
      dateTo: EMPTY_FILTERS.dateTo,
      amountMin: EMPTY_FILTERS.amountMin,
      amountMax: EMPTY_FILTERS.amountMax,
    }),
  );

  const debouncedSearch = useDebounce(rawSearch, 400);

  const activeFilters: TransactionFilters = {
    ...filters,
    search: debouncedSearch,
  };
  const { state, create, update, remove } = useTransactions(activeFilters);
  const { state: catState } = useCategories();

  const categories = catState.status === "success" ? catState.data : [];

  const [modal, setModal] = useState<
    { mode: "create" } | { mode: "edit"; transaction: Transaction } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const hasFilters =
    rawSearch !== "" ||
    filters.categoryId !== "" ||
    filters.preset !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.amountMin !== "" ||
    filters.amountMax !== "";

  const handleClearFilters = useCallback(() => {
    setRawSearch("");
    setFilters({
      categoryId: "",
      preset: "",
      dateFrom: "",
      dateTo: "",
      amountMin: "",
      amountMax: "",
    });
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Transactions</h1>
        <button
          onClick={() => setModal({ mode: "create" })}
          disabled={categories.length === 0}
          title={categories.length === 0 ? "Create a category first" : undefined}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          + Add transaction
        </button>
      </div>

      <FiltersBar
        search={rawSearch}
        onSearchChange={setRawSearch}
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        hasFilters={hasFilters}
        onClearFilters={handleClearFilters}
      />

      <div className="mt-6">
        {state.status === "loading" && <LoadingState />}
        {state.status === "error" && <ErrorState message={state.message} />}
        {state.status === "success" && state.data.length === 0 && (
          <EmptyState hasFilters={hasFilters} />
        )}
        {state.status === "success" && state.data.length > 0 && (
          <TransactionTable
            transactions={state.data}
            categories={categories}
            onEdit={(t) => setModal({ mode: "edit", transaction: t })}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      {modal && (
        <TransactionModal
          mode={modal.mode}
          {...(modal.mode === "edit" && { transaction: modal.transaction })}
          categories={categories}
          onCreate={create}
          onUpdate={update}
          onClose={() => setModal(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          transaction={deleteTarget}
          onConfirm={async () => {
            await remove(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </main>
  );
}

// ─── Filters bar ────────────────────────────────────────────────────────────

type FiltersBarProps = {
  search: string;
  onSearchChange: (v: string) => void;
  filters: Omit<TransactionFilters, "search">;
  onFiltersChange: (f: Omit<TransactionFilters, "search">) => void;
  categories: Category[];
  hasFilters: boolean;
  onClearFilters: () => void;
};

function FiltersBar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  categories,
  hasFilters,
  onClearFilters,
}: FiltersBarProps) {
  const set = <K extends keyof typeof filters>(
    key: K,
    value: (typeof filters)[K],
  ) => onFiltersChange({ ...filters, [key]: value });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by title or notes…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
        />
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={filters.categoryId}
          onChange={(e) => set("categoryId", e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-400"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={filters.preset}
          onChange={(e) => {
            const val = e.target.value as typeof filters.preset;
            onFiltersChange({
              ...filters,
              preset: val,
              dateFrom: "",
              dateTo: "",
            });
          }}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-400"
        >
          <option value="">All time / Custom</option>
          <option value="this_month">This month</option>
          <option value="last_month">Last month</option>
        </select>

        {!filters.preset && (
          <>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => set("dateFrom", e.target.value)}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-400"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => set("dateTo", e.target.value)}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-400"
            />
          </>
        )}

        <input
          type="number"
          placeholder="Min amount"
          min={0}
          value={filters.amountMin}
          onChange={(e) => set("amountMin", e.target.value)}
          className="w-32 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-400"
        />
        <input
          type="number"
          placeholder="Max amount"
          min={0}
          value={filters.amountMax}
          onChange={(e) => set("amountMax", e.target.value)}
          className="w-32 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-400"
        />
      </div>
    </div>
  );
}

// ─── Table ───────────────────────────────────────────────────────────────────

type TransactionTableProps = {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
};

function TransactionTable({
  transactions,
  categories,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                  {formatDate(t.date)}
                </td>
                <td className="px-4 py-3 text-zinc-900 font-medium">
                  {t.title}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {catMap.get(t.categoryId) ?? "—"}
                </td>
                <td className="px-4 py-3 text-right text-zinc-900 tabular-nums whitespace-nowrap">
                  {formatAmount(t.amount, t.currency)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => onEdit(t)}
                      className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(t)}
                      className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="sm:hidden space-y-3">
        {transactions.map((t) => (
          <li
            key={t.id}
            className="rounded-lg border border-zinc-200 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-zinc-900 truncate">{t.title}</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {catMap.get(t.categoryId) ?? "—"} · {formatDate(t.date)}
                </p>
              </div>
              <p className="shrink-0 font-medium text-zinc-900 tabular-nums">
                {formatAmount(t.amount, t.currency)}
              </p>
            </div>
            <div className="mt-2 flex gap-1">
              <button
                onClick={() => onEdit(t)}
                className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(t)}
                className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

type TransactionModalProps = {
  mode: "create" | "edit";
  transaction?: Transaction;
  categories: Category[];
  onCreate: (payload: {
    title: string;
    amount: number;
    currency: string;
    date: string;
    categoryId: string;
    notes?: string;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    payload: Partial<{
      title: string;
      amount: number;
      currency: string;
      date: string;
      categoryId: string;
      notes?: string;
    }>,
  ) => Promise<void>;
  onClose: () => void;
};

type FormState = {
  title: string;
  amount: string;
  currency: string;
  date: string;
  categoryId: string;
  notes: string;
};

function TransactionModal({
  mode,
  transaction,
  categories,
  onCreate,
  onUpdate,
  onClose,
}: TransactionModalProps) {
  const [form, setForm] = useState<FormState>(() => ({
    title: transaction?.title ?? "",
    amount: transaction ? String(parseFloat(transaction.amount)) : "",
    currency: transaction?.currency ?? "USD",
    date: transaction ? transaction.date.slice(0, 10) : todayIso(),
    categoryId: transaction?.categoryId ?? categories[0]?.id ?? "",
    notes: transaction?.notes ?? "",
  }));
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) next.title = "Title is required";
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0)
      next.amount = "Enter a positive amount";
    if (!form.currency.trim()) next.currency = "Currency is required";
    if (!form.date) next.date = "Date is required";
    if (!form.categoryId) next.categoryId = "Select a category";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError(null);
    try {
      const base = {
        title: form.title.trim(),
        amount: parseFloat(form.amount),
        currency: form.currency.trim().toUpperCase(),
        date: form.date,
        categoryId: form.categoryId,
        ...(form.notes.trim() && { notes: form.notes.trim() }),
      };
      if (mode === "create") {
        await onCreate(base);
      } else if (transaction) {
        await onUpdate(transaction.id, base);
      }
      onClose();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-5 text-base font-semibold text-zinc-900">
          {mode === "create" ? "Add transaction" : "Edit transaction"}
        </h2>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <Field label="Title" error={errors.title}>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              maxLength={255}
              className={inputCls(!!errors.title)}
              placeholder="e.g. Grocery shopping"
            />
          </Field>

          <div className="flex gap-3">
            <Field label="Amount" error={errors.amount} className="flex-1">
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setField("amount", e.target.value)}
                min={0.01}
                step={0.01}
                className={inputCls(!!errors.amount)}
                placeholder="0.00"
              />
            </Field>
            <Field label="Currency" error={errors.currency} className="w-28">
              <select
                value={form.currency}
                onChange={(e) => setField("currency", e.target.value)}
                className={inputCls(!!errors.currency)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Date" error={errors.date}>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setField("date", e.target.value)}
              className={inputCls(!!errors.date)}
            />
          </Field>

          <Field label="Category" error={errors.categoryId}>
            <select
              value={form.categoryId}
              onChange={(e) => setField("categoryId", e.target.value)}
              className={inputCls(!!errors.categoryId)}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Notes (optional)" error={errors.notes}>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              maxLength={1000}
              rows={2}
              className={inputCls(false) + " resize-none"}
              placeholder="Optional notes…"
            />
          </Field>

          {serverError && <p className="text-sm text-red-500">{serverError}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving…" : mode === "create" ? "Add" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirm ──────────────────────────────────────────────────────────

type DeleteConfirmProps = {
  transaction: Transaction;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

function DeleteConfirm({
  transaction,
  onConfirm,
  onCancel,
}: DeleteConfirmProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-zinc-900">
          Delete transaction?
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          &ldquo;{transaction.title}&rdquo; will be permanently deleted.
        </p>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleConfirm()}
            disabled={loading}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Misc components ─────────────────────────────────────────────────────────

type FieldProps = {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
  className?: string | undefined;
};

function Field({ label, error, children, className }: FieldProps) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-zinc-600">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
    </div>
  );
}

type EmptyStateProps = { hasFilters: boolean };

function EmptyState({ hasFilters }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-200 py-16 text-center">
      <p className="text-sm text-zinc-400">
        {hasFilters ? "No results for this search" : "No transactions yet"}
      </p>
      {!hasFilters && (
        <p className="mt-1 text-xs text-zinc-300">
          Click &ldquo;+ Add transaction&rdquo; to get started
        </p>
      )}
    </div>
  );
}

type ErrorStateProps = { message: string };

function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
      {message}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function inputCls(hasError: boolean): string {
  return [
    "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors",
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-zinc-200 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100",
  ].join(" ");
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  return new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: string, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(parseFloat(amount));
}
