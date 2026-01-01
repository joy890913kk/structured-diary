"use client";

import { useEffect, useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import type { Category, Item } from "@/lib/types";

type Entry = {
  id: string;
  entryDate: string;
  categoryId: string;
  itemId: string;
  content: string;
  createdAt: string;
  category?: Category;
  item?: Item;
};

function yyyyMmDd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonthDays(year: number, monthIndex0: number) {
  const first = new Date(year, monthIndex0, 1);
  const startDay = first.getDay();

  const cells: Array<{ date: Date; inMonth: boolean }> = [];
  const start = new Date(year, monthIndex0, 1 - startDay);
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({ date: d, inMonth: d.getMonth() === monthIndex0 });
  }
  return { cells };
}

export default function DiaryPage() {
  const today = new Date();

  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategoriesForDisplay, setAllCategoriesForDisplay] = useState<Category[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth0, setViewMonth0] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(yyyyMmDd(today));

  const [isOpen, setIsOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [formCategoryId, setFormCategoryId] = useState<string>("");
  const [formItemId, setFormItemId] = useState<string>("");
  const [formContent, setFormContent] = useState<string>("");

  // Load active categories for form selection
  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  // Load all categories (including inactive) for displaying historical entries
  const loadAllCategories = async () => {
    try {
      const res = await fetch("/api/categories?includeInactive=true");
      const data = await res.json();
      setAllCategoriesForDisplay(data);
    } catch (error) {
      console.error("Failed to load all categories:", error);
    }
  };

  // Load all entries from API
  const loadEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/entries");
      const data = await res.json();
      setEntries(data);
    } catch (error) {
      console.error("Failed to load entries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadAllCategories();
    loadEntries();
  }, []);

  // Reload data when page becomes visible or gains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadCategories();
        loadAllCategories();
        loadEntries();
      }
    };

    const handleFocus = () => {
      loadCategories();
      loadAllCategories();
      loadEntries();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const activeCategories = useMemo(() => {
    return (categories ?? [])
      .filter((c) => c.isActive !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [categories]);

  const itemsForSelectedCategory = useMemo(() => {
    const cat = categories.find((c) => c.id === formCategoryId);
    return (cat?.items ?? [])
      .filter((i) => i.isActive !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [categories, formCategoryId]);

  const entriesOfSelectedDate = useMemo(() => {
    return entries
      .filter((e) => {
        const entryDate = yyyyMmDd(new Date(e.entryDate));
        return entryDate === selectedDate;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [entries, selectedDate]);

  const openAdd = async () => {
    // Reload categories to ensure we have the latest data from settings
    const res = await fetch("/api/categories");
    const freshCategories = await res.json();
    setCategories(freshCategories);

    const defaultCat = freshCategories.find((c: Category) => c.isActive !== false);
    const defaultItem = defaultCat?.items?.find((i: Item) => i.isActive !== false);

    setEditingEntryId(null);
    setFormCategoryId(defaultCat?.id ?? "");
    setFormItemId(defaultItem?.id ?? "");
    setFormContent("");
    setIsOpen(true);
  };

  const openEdit = (entry: Entry) => {
    setEditingEntryId(entry.id);
    setFormCategoryId(entry.categoryId);
    setFormItemId(entry.itemId);
    setFormContent(entry.content);
    setIsOpen(true);
  };

  // When category changes in modal, jump to first available item
  useEffect(() => {
    if (!formCategoryId) return;
    const cat = categories.find((c) => c.id === formCategoryId);
    const firstItem = cat?.items?.find((i) => i.isActive !== false);
    setFormItemId((firstItem as any)?.id ?? "");
  }, [formCategoryId, categories]);

  const saveEntry = async () => {
    if (!formCategoryId) return;
    if (!formItemId) return;

    const content = formContent.trim();
    if (!content) return;

    try {
      if (editingEntryId) {
        const res = await fetch(`/api/entries/${editingEntryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entryDate: selectedDate,
            categoryId: formCategoryId,
            itemId: formItemId,
            content,
          }),
        });

        const updatedEntry = await res.json();
        setEntries((prev) => prev.map((e) => (e.id === editingEntryId ? updatedEntry : e)));
      } else {
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entryDate: selectedDate,
            categoryId: formCategoryId,
            itemId: formItemId,
            content,
          }),
        });

        const newEntry = await res.json();
        setEntries((prev) => [newEntry, ...prev]);
      }

      setIsOpen(false);
      setFormContent("");
      setEditingEntryId(null);
    } catch (error) {
      console.error("Failed to save entry:", error);
      alert("Failed to save entry");
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (error) {
      console.error("Failed to delete entry:", error);
      alert("Failed to delete entry");
    }
  };

  const { cells } = useMemo(() => getMonthDays(viewYear, viewMonth0), [viewYear, viewMonth0]);

  const monthLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth0, 1);
    return d.toLocaleString(undefined, { year: "numeric", month: "long" });
  }, [viewYear, viewMonth0]);

  const nextMonth = () => {
    const d = new Date(viewYear, viewMonth0 + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth0(d.getMonth());
  };

  const prevMonth = () => {
    const d = new Date(viewYear, viewMonth0 - 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth0(d.getMonth());
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth0(today.getMonth());
    setSelectedDate(yyyyMmDd(today));
  };

  const categoryName = (id: string) => allCategoriesForDisplay.find((c) => c.id === id)?.name ?? "";

  const itemName = (catId: string, itemId: string) =>
    allCategoriesForDisplay.find((c) => c.id === catId)?.items?.find((i) => i.id === itemId)?.name ?? "";

  const getItemEmoji = (catId: string, itemId: string) =>
    allCategoriesForDisplay.find((c) => c.id === catId)?.items?.find((i) => i.id === itemId)?.emoji ?? "";

  if (loading) {
    return (
      <div>
        <TopNav />
        <div className="flex items-center justify-center py-20">
          <p className="text-app-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopNav />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-app-muted">Diary</p>
          <h1 className="text-xl font-semibold">Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="rounded-full border border-app-border px-3 py-1 text-xs">
            Prev
          </button>
          <button onClick={goToday} className="rounded-full border border-app-border px-3 py-1 text-xs">
            Today
          </button>
          <button onClick={nextMonth} className="rounded-full border border-app-border px-3 py-1 text-xs">
            Next
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-app-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">{monthLabel}</p>
          <p className="text-xs text-app-muted">Click a date to add an entry</p>
        </div>

        <div className="grid grid-cols-7 gap-2 text-xs text-app-muted">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-1">
              {d}
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {cells.map(({ date, inMonth }) => {
            const key = yyyyMmDd(date);
            const isSelected = key === selectedDate;
            const hasEntry = entries.some((e) => yyyyMmDd(new Date(e.entryDate)) === key);

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(key)}
                className={[
                  "rounded-xl border px-2 py-2 text-left",
                  inMonth ? "border-app-border" : "border-transparent opacity-40",
                  isSelected ? "bg-app-bg" : "bg-transparent",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{date.getDate()}</span>
                  {hasEntry && <span className="text-[10px] text-app-muted">•</span>}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-app-border p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-app-muted">{selectedDate}</p>
              <p className="text-sm font-semibold">Today's Entries</p>
            </div>

            <button onClick={openAdd} className="rounded-full bg-app-accent px-3 py-2 text-xs">
              + Add
            </button>
          </div>

          {entriesOfSelectedDate.length === 0 ? (
            <p className="mt-3 text-sm text-app-muted">No entries for this day</p>
          ) : (
            <div className="mt-3 space-y-2">
              {entriesOfSelectedDate.map((e) => (
                <div key={e.id} className="rounded-xl bg-app-bg px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      <span className="rounded-full border border-app-border px-2 py-1 text-xs text-app-muted">
                        {categoryName(e.categoryId)} › {getItemEmoji(e.categoryId, e.itemId)} {itemName(e.categoryId, e.itemId)}
                      </span>
                      <p className="text-sm">{e.content}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(e)}
                        className="rounded px-2 py-1 text-xs text-app-muted hover:bg-app-card"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteEntry(e.id)}
                        className="rounded px-2 py-1 text-xs text-red-500 hover:bg-app-card"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 md:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-app-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{editingEntryId ? "Edit Entry" : "Add Entry"}</p>
              <button onClick={() => setIsOpen(false)} className="text-xs text-app-muted">
                Close
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-app-muted">Category</p>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-app-border bg-transparent px-3 py-2 text-sm"
                  >
                    {activeCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="mb-1 text-xs text-app-muted">Item</p>
                  <select
                    value={formItemId}
                    onChange={(e) => setFormItemId(e.target.value)}
                    className="w-full rounded-xl border border-app-border bg-transparent px-3 py-2 text-sm"
                  >
                    {itemsForSelectedCategory.map((it: any) => (
                      <option key={it.id} value={it.id}>
                        {it.emoji ? `${it.emoji} ` : ""}
                        {it.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs text-app-muted">Content</p>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="What did you do today?"
                  className="h-28 w-full resize-none rounded-2xl border border-app-border bg-transparent px-3 py-2 text-sm"
                />
              </div>

              <button onClick={saveEntry} className="w-full rounded-2xl bg-app-accent px-3 py-2 text-sm">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
