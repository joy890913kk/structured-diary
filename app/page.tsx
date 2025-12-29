"use client";

import { useEffect, useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import type { Category, Item } from "@/lib/types";

const LS_CATEGORIES = "sd_categories_v1";
const LS_ENTRIES = "sd_entries_v1";

type Entry = {
  id: string;
  date: string; // yyyy-MM-dd
  categoryId: string;
  itemId: string;
  content: string;
  createdAt: string;
};

function yyyyMmDd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonthDays(year: number, monthIndex0: number) {
  const first = new Date(year, monthIndex0, 1);
  const startDay = first.getDay(); // 0 Sun - 6 Sat

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
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesLoaded, setEntriesLoaded] = useState(false);


  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth0, setViewMonth0] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(yyyyMmDd(today));

  const [isOpen, setIsOpen] = useState(false);
  const [formCategoryId, setFormCategoryId] = useState<string>("");
  const [formItemId, setFormItemId] = useState<string>("");
  const [formContent, setFormContent] = useState<string>("");

  // -----------------------------
  // Load categories (from localStorage, fallback to mock)
  // -----------------------------
  useEffect(() => {
    const raw = localStorage.getItem(LS_CATEGORIES);
    if (raw) {
      try {
        setCategories(JSON.parse(raw));
        return;
      } catch {}
    }

    const mock: Category[] = [
      {
        id: "cat_work",
        name: "Work",
        isActive: true,
        order: 1,
        items: [
          { id: "item_plan", name: "Plan", isActive: true, order: 1 } as Item,
          { id: "item_execute", name: "Execute", isActive: true, order: 2 } as Item,
        ],
      },
      {
        id: "cat_health",
        name: "Health",
        isActive: true,
        order: 2,
        items: [{ id: "item_run", name: "Run", isActive: true, order: 1 } as Item],
      },
    ];
    setCategories(mock);
  }, []);

  // -----------------------------
  // Load entries (and normalize old storage format)
  // -----------------------------
  useEffect(() => {
    const raw = localStorage.getItem(LS_ENTRIES);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const normalized: Entry[] = Array.isArray(parsed) ? parsed : [parsed];
        setEntries(normalized);
      } catch (e) {
        console.error("Failed to parse entries:", e);
      }
    }
    // ✅ 不管有沒有資料，都標記「已經讀完」
    setEntriesLoaded(true);
  }, []);
  

  // -----------------------------
  // Persist entries
  // -----------------------------
  useEffect(() => {
    if (!entriesLoaded) return; // ❗ 關鍵：初始化前不准寫
    localStorage.setItem(LS_ENTRIES, JSON.stringify(entries));
  }, [entries, entriesLoaded]);
  

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
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [entries, selectedDate]);

  const openAdd = () => {
    const defaultCat = activeCategories[0];
    const defaultItem = defaultCat?.items?.find((i) => i.isActive !== false);

    setFormCategoryId(defaultCat?.id ?? "");
    setFormItemId((defaultItem as any)?.id ?? "");
    setFormContent("");
    setIsOpen(true);
  };

  // When category changes in modal, jump to first available item
  useEffect(() => {
    if (!formCategoryId) return;
    const cat = categories.find((c) => c.id === formCategoryId);
    const firstItem = cat?.items?.find((i) => i.isActive !== false);
    setFormItemId((firstItem as any)?.id ?? "");
  }, [formCategoryId, categories]);

  const saveEntry = () => {
    if (!selectedDate) return;
    if (!formCategoryId) return;
    if (!formItemId) return;

    const content = formContent.trim();
    if (!content) return;

    const newEntry: Entry = {
      id: `e_${Date.now()}`,
      date: selectedDate,
      categoryId: formCategoryId,
      itemId: formItemId,
      content,
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) => [newEntry, ...prev]);
    setIsOpen(false);
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

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "";

  const itemInfo = (catId: string, itemId: string) =>
    categories.find((c) => c.id === catId)?.items?.find((i: any) => i.id === itemId);

  const itemEmojiOf = (catId: string, itemId: string) => (itemInfo(catId, itemId) as any)?.emoji ?? "";

  const itemName = (catId: string, itemId: string) =>
    categories.find((c) => c.id === catId)?.items?.find((i) => i.id === itemId)?.name ?? "";

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
          <p className="text-xs text-app-muted">點日期 → 右側新增紀錄</p>
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
            const hasEntry = entries.some((e) => e.date === key);

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

        {/* Right-ish area: selected day panel */}
        <div className="mt-4 rounded-2xl border border-app-border p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-app-muted">{selectedDate}</p>
              <p className="text-sm font-semibold">今日紀錄</p>
            </div>

            <button onClick={openAdd} className="rounded-full bg-app-accent px-3 py-2 text-xs">
              ＋ 新增
            </button>
          </div>

          {entriesOfSelectedDate.length === 0 ? (
            <p className="mt-3 text-sm text-app-muted">當天還沒有紀錄</p>
          ) : (
            <div className="mt-3 space-y-2">
              {entriesOfSelectedDate.map((e) => (
                <div key={e.id} className="rounded-xl bg-app-bg px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-app-border px-2 py-1 text-xs text-app-muted">
                      {itemEmojiOf(e.categoryId, e.itemId) ? `${itemEmojiOf(e.categoryId, e.itemId)} ` : ""}
                      {categoryName(e.categoryId)} › {itemName(e.categoryId, e.itemId)}
                    </span>
                    <p className="text-sm">{e.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 md:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-app-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">新增紀錄</p>
              <button onClick={() => setIsOpen(false)} className="text-xs text-app-muted">
                關閉
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-app-muted">類別</p>
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
                  <p className="mb-1 text-xs text-app-muted">項目</p>
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
                <p className="mb-1 text-xs text-app-muted">內容</p>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="今天做了什麼？（可簡短）"
                  className="h-28 w-full resize-none rounded-2xl border border-app-border bg-transparent px-3 py-2 text-sm"
                />
              </div>

              <button onClick={saveEntry} className="w-full rounded-2xl bg-app-accent px-3 py-2 text-sm">
                儲存
              </button>

              <p className="text-xs text-app-muted">
                ✅ 已支援 localStorage：重整不消失
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

