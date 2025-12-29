"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, Entry, Item } from "@/lib/types";
import clsx from "clsx";

const emptyForm = {
  entryDate: "",
  categoryId: "",
  itemId: "",
  content: "",
};

type EntryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: typeof emptyForm, entryId?: string) => Promise<void>;
  categories: Category[];
  editing?: Entry | null;
  defaultDate: string;
};

export default function EntryModal({
  isOpen,
  onClose,
  onSave,
  categories,
  editing,
  defaultDate,
}: EntryModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        entryDate: editing.entryDate.slice(0, 10),
        categoryId: editing.categoryId,
        itemId: editing.itemId,
        content: editing.content,
      });
    } else {
      setForm({ ...emptyForm, entryDate: defaultDate });
    }
    setError(null);
  }, [editing, defaultDate, isOpen]);

  const items = useMemo(() => {
    const selected = categories.find((category) => category.id === form.categoryId);
    return selected?.items?.filter((item) => item.isActive) ?? [];
  }, [categories, form.categoryId]);

  const handleChange = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.categoryId || !form.itemId) {
      setError("請先選擇類別與項目");
      return;
    }
    if (!form.content.trim()) {
      setError("請輸入內容");
      return;
    }

    setSaving(true);
    try {
      await onSave(form, editing?.id);
      onClose();
    } catch (err) {
      setError("儲存失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-app-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editing ? "編輯日記" : "新增日記"}
          </h2>
          <button
            onClick={onClose}
            className="text-app-muted hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs text-app-muted">Date</label>
            <input
              type="date"
              value={form.entryDate}
              onChange={(event) => handleChange("entryDate", event.target.value)}
              className="w-full rounded-xl border border-app-border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs text-app-muted">Category</label>
            <select
              value={form.categoryId}
              onChange={(event) => {
                handleChange("categoryId", event.target.value);
                handleChange("itemId", "");
              }}
              className="w-full rounded-xl border border-app-border bg-transparent px-3 py-2 text-sm"
            >
              <option value="">選擇類別</option>
              {categories
                .filter((category) => category.isActive)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs text-app-muted">Item</label>
            <select
              value={form.itemId}
              onChange={(event) => handleChange("itemId", event.target.value)}
              className="w-full rounded-xl border border-app-border bg-transparent px-3 py-2 text-sm"
              disabled={!form.categoryId}
            >
              <option value="">選擇項目</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs text-app-muted">Content</label>
            <textarea
              value={form.content}
              onChange={(event) => handleChange("content", event.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-app-border bg-transparent px-3 py-2 text-sm"
              placeholder="今天做了什麼？"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full border border-app-border px-4 py-2 text-sm text-app-muted"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-semibold",
              saving ? "bg-app-border" : "bg-app-accent"
            )}
          >
            {saving ? "儲存中..." : "儲存"}
          </button>
        </div>
      </div>
    </div>
  );
}
