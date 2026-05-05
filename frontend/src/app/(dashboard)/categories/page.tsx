"use client";

import { useState } from "react";
import { useCategories } from "../../../hooks/use-categories";
import type { Category } from "../../../types/category";

export default function CategoriesPage() {
  const { state, create, rename, remove } = useCategories();

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="text-xl font-semibold mb-6">Categories</h1>
      <CreateCategoryForm onCreate={create} />
      <div className="mt-6">
        {state.status === "loading" && <LoadingState />}
        {state.status === "error" && <ErrorState message={state.message} />}
        {state.status === "success" && state.data.length === 0 && (
          <EmptyState />
        )}
        {state.status === "success" && state.data.length > 0 && (
          <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
            {state.data.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                onRename={rename}
                onRemove={remove}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

type CreateCategoryFormProps = {
  onCreate: (name: string) => Promise<void>;
};

function CreateCategoryForm({ onCreate }: CreateCategoryFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onCreate(trimmed);
      setName("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create category",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex gap-2">
      <div className="flex-1">
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder="New category name"
          maxLength={100}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Adding…" : "Add"}
      </button>
    </form>
  );
}

type CategoryRowProps = {
  category: Category;
  onRename: (id: string, name: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
};

function CategoryRow({ category, onRename, onRemove }: CategoryRowProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    if (trimmed === category.name) {
      setEditing(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onRename(category.id, trimmed);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    setError(null);
    try {
      await onRemove(category.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <li className="px-4 py-3">
        <form onSubmit={(e) => void handleRename(e)} className="flex gap-2">
          <input
            autoFocus
            type="text"
            value={editName}
            onChange={(e) => {
              setEditName(e.target.value);
              setError(null);
            }}
            maxLength={100}
            className="flex-1 rounded border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-zinc-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded px-3 py-1 text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setEditName(category.name);
              setError(null);
            }}
            className="rounded px-3 py-1 text-sm text-zinc-500 hover:bg-zinc-100 transition-colors"
          >
            Cancel
          </button>
        </form>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-zinc-800">{category.name}</span>
      <div className="flex items-center gap-1">
        {error && <span className="text-xs text-red-500 mr-2">{error}</span>}
        <button
          onClick={() => setEditing(true)}
          disabled={loading}
          className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors disabled:opacity-50"
        >
          Rename
        </button>
        <button
          onClick={() => void handleRemove()}
          disabled={loading}
          className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          {loading ? "…" : "Delete"}
        </button>
      </div>
    </li>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-zinc-200 py-12 text-center">
      <p className="text-sm text-zinc-400">No categories yet</p>
      <p className="mt-1 text-xs text-zinc-300">
        Add your first category above
      </p>
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
