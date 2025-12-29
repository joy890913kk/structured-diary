"use client";

import { useEffect, useMemo, useState } from "react";
import { addMonths, format, isSameMonth, isSameDay, parseISO } from "date-fns";
import TopNav from "@/components/TopNav";
import EntryModal from "@/components/EntryModal";
import { formatDate, getCalendarDays } from "@/lib/date";
import type { Category, Entry } from "@/lib/types";
import clsx from "clsx";

const weekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ViewMode = "calendar" | "list";

export default function HomePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  const monthKey = format(currentMonth, "yyyy-MM");

  const entryDots = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((entry) => {
      const key = entry.entryDate.slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [entries]);

  const selectedEntries = useMemo(() => {
    const key = formatDate(selectedDate);
    return entries.filter((entry) => entry.entryDate.startsWith(key));
  }, [entries, selectedDate]);

  const monthEntries = useMemo(() => {
    return [...entries].sort((a, b) => (a.entryDate < b.entryDate ? 1 : -1));
  }, [entries]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoryRes, entriesRes] = await Promise.all([
        fetch("/api/categories"),
        fetch(`/api/entries?month=${monthKey}`),
      ]);
      const categoriesData = await categoryRes.json();
      const entriesData = await entriesRes.json();
      setCategories(categoriesData);
      setEntries(entriesData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [monthKey]);

  const handleSaveEntry = async (payload: {
    entryDate: string;
    categoryId: string;
    itemId: string;
    content: string;
  }, entryId?: string) => {
    const method = entryId ? "PUT" : "POST";
    const url = entryId ? `/api/entries/${entryId}` : "/api/entries";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to save entry");
    }

    await loadData();
  };

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setModalOpen(true);
  };

  const handleDelete = async (entry: Entry) => {
    await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    await loadData();
  };

  return (
    <div>
      <TopNav />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-app-muted">{format(currentMonth, "yyyy MMMM")}</p>
          <h1 className="text-xl font-semibold">Diary</h1>
        </div>
        <div className="flex gap-2 rounded-full bg-app-card p-1 text-xs">
          <button
            onClick={() => setViewMode("calendar")}
            className={clsx(
              "rounded-full px-3 py-1",
              viewMode === "calendar" ? "bg-app-accent" : "text-app-muted"
            )}
          >
            Calendar
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={clsx(
              "rounded-full px-3 py-1",
              viewMode === "list" ? "bg-app-accent" : "text-app-muted"
            )}
          >
            List
          </button>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
          className="rounded-full border border-app-border px-3 py-1 text-xs text-app-muted"
        >
          Prev
        </button>
        <button
          onClick={() => setCurrentMonth(new Date())}
          className="rounded-full border border-app-border px-3 py-1 text-xs text-app-muted"
        >
          Today
        </button>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="rounded-full border border-app-border px-3 py-1 text-xs text-app-muted"
        >
          Next
        </button>
      </div>

      {viewMode === "calendar" ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-app-card p-4">
            <div className="grid grid-cols-7 text-center text-xs text-app-muted">
              {weekLabels.map((label) => (
                <div key={label} className="py-2">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {getCalendarDays(currentMonth).map((date) => {
                const dayKey = formatDate(date);
                const dotCount = entryDots.get(dayKey) ?? 0;
                const inMonth = isSameMonth(date, currentMonth);
                const isSelected = isSameDay(date, selectedDate);
                return (
                  <button
                    key={dayKey}
                    onClick={() => setSelectedDate(date)}
                    className={clsx(
                      "flex h-12 flex-col items-center justify-center rounded-xl border border-transparent text-sm",
                      isSelected ? "border-app-accent bg-app-border" : "hover:border-app-border",
                      inMonth ? "text-white" : "text-app-muted"
                    )}
                  >
                    <span>{format(date, "d")}</span>
                    {dotCount > 0 && (
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-app-accent" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-app-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{format(selectedDate, "MMM d")}</h2>
              <button
                onClick={() => {
                  setEditingEntry(null);
                  setModalOpen(true);
                }}
                className="rounded-full bg-app-accent px-3 py-1 text-xs"
              >
                + 新增
              </button>
            </div>
            {loading ? (
              <p className="text-sm text-app-muted">載入中...</p>
            ) : selectedEntries.length === 0 ? (
              <p className="text-sm text-app-muted">當天還沒有紀錄</p>
            ) : (
              <div className="space-y-3">
                {selectedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-app-border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">
                          {entry.category?.name} / {entry.item?.name}
                        </p>
                        <p className="text-xs text-app-muted">{entry.content}</p>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-app-muted hover:text-white"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(entry)}
                          className="text-red-400"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-app-card p-4">
          <h2 className="mb-3 text-sm font-semibold">本月全部紀錄</h2>
          {loading ? (
            <p className="text-sm text-app-muted">載入中...</p>
          ) : monthEntries.length === 0 ? (
            <p className="text-sm text-app-muted">本月還沒有紀錄</p>
          ) : (
            <div className="space-y-3">
              {monthEntries.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-app-border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-app-muted">
                        {format(parseISO(entry.entryDate), "yyyy-MM-dd")}
                      </p>
                      <p className="text-sm font-semibold">
                        {entry.category?.name} / {entry.item?.name}
                      </p>
                      <p className="text-xs text-app-muted">{entry.content}</p>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="text-app-muted hover:text-white"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDelete(entry)}
                        className="text-red-400"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => {
          setEditingEntry(null);
          setModalOpen(true);
        }}
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-app-accent text-xl shadow-lg"
        aria-label="Add entry"
      >
        +
      </button>

      <EntryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEntry}
        categories={categories}
        editing={editingEntry}
        defaultDate={formatDate(selectedDate)}
      />
    </div>
  );
}
