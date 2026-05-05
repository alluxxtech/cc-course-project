"use client";

import { useState } from "react";
import { useBudget } from "../../../hooks/use-budget";
import type { BudgetResponse } from "../../../types/budget";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getBarColor(pct: number): string {
  if (pct >= 100) return "bg-red-500";
  if (pct >= 80) return "bg-orange-500";
  if (pct >= 50) return "bg-amber-400";
  return "bg-green-500";
}

function getUsageColor(pct: number): string {
  if (pct >= 100) return "text-red-600";
  if (pct >= 80) return "text-orange-600";
  if (pct >= 50) return "text-amber-600";
  return "text-green-600";
}

// ─── Set budget form ───────────────────────────────────────────────────────────

type SetBudgetFormProps = {
  initialAmount: string;
  onSave: (amount: number) => Promise<void>;
  onCancel: () => void;
};

function SetBudgetForm({
  initialAmount,
  onSave,
  onCancel,
}: SetBudgetFormProps) {
  const [value, setValue] = useState(initialAmount);
  const [error, setError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = Number(value);
    if (!value.trim() || isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid amount greater than 0");
      return;
    }
    if (parsed > 9_999_999_999.99) {
      setError("Amount is too large");
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      await onSave(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save budget");
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="budget-amount"
          className="text-sm font-medium text-zinc-700"
        >
          Monthly budget amount
        </label>
        <input
          id="budget-amount"
          type="number"
          step="0.01"
          min="0.01"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(undefined);
          }}
          placeholder="0.00"
          autoFocus
          className="w-48 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
        />
        {error !== undefined && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Budget widget ─────────────────────────────────────────────────────────────

type BudgetWidgetProps = {
  state:
    | { status: "loading" }
    | { status: "success"; data: BudgetResponse }
    | { status: "error"; message: string };
  onSetBudget: (amount: number) => Promise<void>;
};

function BudgetWidget({ state, onSetBudget }: BudgetWidgetProps) {
  const [editing, setEditing] = useState(false);

  function startEdit() {
    setEditing(true);
  }

  async function handleSave(amount: number) {
    await onSetBudget(amount);
    setEditing(false);
  }

  if (state.status === "loading") {
    return (
      <div className="animate-pulse rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="mb-4 h-5 w-32 rounded bg-zinc-100" />
        <div className="mb-2 h-8 w-24 rounded bg-zinc-100" />
        <div className="mb-4 h-3 w-full rounded bg-zinc-100" />
        <div className="flex gap-6">
          <div className="h-4 w-20 rounded bg-zinc-100" />
          <div className="h-4 w-20 rounded bg-zinc-100" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6">
        <p className="text-sm text-red-700">{state.message}</p>
      </div>
    );
  }

  const { data } = state;

  if (!data.budgetSet) {
    return (
      <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
        {editing ? (
          <SetBudgetForm
            initialAmount=""
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-zinc-500">
              No budget set for this month.
            </p>
            <button
              onClick={startEdit}
              className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              Set budget
            </button>
          </div>
        )}
      </div>
    );
  }

  const { amount, spent, remaining, usagePercent } = data;
  const barWidth = Math.min(100, usagePercent);

  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
      {editing ? (
        <SetBudgetForm
          initialAmount={String(amount)}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500">Monthly budget</p>
              <p className="text-3xl font-semibold text-zinc-900">
                {formatMoney(amount)}
              </p>
            </div>
            <button
              onClick={startEdit}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
            >
              Edit
            </button>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500">
              <span>
                Spent:{" "}
                <span className={`font-medium ${getUsageColor(usagePercent)}`}>
                  {formatMoney(spent)}
                </span>
              </span>
              <span className={`font-medium ${getUsageColor(usagePercent)}`}>
                {usagePercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className={`h-full rounded-full transition-all ${getBarColor(usagePercent)}`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>

          <div className="border-t border-zinc-50 pt-4">
            <p className="text-xs text-zinc-400">Remaining</p>
            <p
              className={`text-base font-medium ${remaining < 0 ? "text-red-600" : "text-zinc-800"}`}
            >
              {remaining < 0 ? "−" : ""}
              {formatMoney(Math.abs(remaining))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { state, setBudget } = useBudget(year, month);

  function goToPrev() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNext() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={goToPrev}
          className="rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
        >
          ← Prev
        </button>
        <h1 className="min-w-44 text-center text-lg font-semibold text-zinc-900">
          {MONTH_NAMES.at(month - 1) ?? ""} {year}
        </h1>
        <button
          onClick={goToNext}
          className="rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
        >
          Next →
        </button>
      </div>

      <div className="max-w-md">
        <BudgetWidget
          key={`${year}-${month}`}
          state={state}
          onSetBudget={setBudget}
        />
      </div>
    </main>
  );
}
