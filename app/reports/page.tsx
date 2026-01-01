"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import TopNav from "@/components/TopNav";
import type { Category, Entry } from "@/lib/types";
import { formatDate } from "@/lib/date";
import * as XLSX from "xlsx";

const colorPalette = ["#3b82f6", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6"];

type CategoryStat = {
  id: string;
  name: string;
  color?: string | null;
  count: number;
  items: [string, number][];
};

export default function ReportsPage() {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [categoryRes, entryRes] = await Promise.all([
      fetch("/api/categories?includeInactive=true"),
      fetch(`/api/entries?month=${month}`),
    ]);
    const categoryData = await categoryRes.json();
    const entryData = await entryRes.json();
    setCategories(categoryData);
    setEntries(entryData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [month]);

  const stats = useMemo(() => {
    const categoryMap = new Map<
      string,
      { name: string; color?: string | null; count: number; items: Map<string, number> }
    >();

    entries.forEach((entry) => {
      const category = entry.category || categories.find((c) => c.id === entry.categoryId);
      const item = entry.item;
      if (!category) return;

      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, {
          name: category.name,
          color: category.color,
          count: 0,
          items: new Map(),
        });
      }
      const target = categoryMap.get(category.id)!;
      target.count += 1;
      if (item) {
        target.items.set(item.name, (target.items.get(item.name) ?? 0) + 1);
      }
    });

    const list: CategoryStat[] = Array.from(categoryMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        color: data.color,
        count: data.count,
        items: Array.from(data.items.entries()),
      }))
      .sort((a, b) => b.count - a.count);

    const total = list.reduce((sum, item) => sum + item.count, 0);

    return { list, total };
  }, [entries, categories]);

  const recentEntriesByCategory = useMemo(() => {
    const map = new Map<string, Entry[]>();
    entries.forEach((entry) => {
      const key = entry.categoryId;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(entry);
    });

    map.forEach((value) => {
      value.sort((a, b) => (a.entryDate < b.entryDate ? 1 : -1));
    });

    return map;
  }, [entries]);

  const exportExcel = () => {
    const allDatesIn2026: string[] = [];
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(2026, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `2026-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        allDatesIn2026.push(dateStr);
      }
    }

    const categoryItemMap = new Map<string, { category: string; items: string[] }>();
    categories.forEach((category) => {
      category.items?.forEach((item) => {
        const key = `${category.name}::${item.name}`;
        if (!categoryItemMap.has(key)) {
          categoryItemMap.set(key, { category: category.name, items: [item.name] });
        }
      });
    });

    const dateEntryMap = new Map<string, Map<string, string[]>>();
    entries.forEach((entry) => {
      const dateKey = entry.entryDate.slice(0, 10);
      if (!dateEntryMap.has(dateKey)) {
        dateEntryMap.set(dateKey, new Map());
      }
      const categoryName = entry.category?.name ?? "";
      const itemName = entry.item?.name ?? "";
      const key = `${categoryName}::${itemName}`;

      const entryMap = dateEntryMap.get(dateKey)!;
      if (!entryMap.has(key)) {
        entryMap.set(key, []);
      }
      entryMap.get(key)!.push(entry.content);
    });

    const headerRow1: string[] = ["Date"];
    const headerRow2: string[] = [""];

    Array.from(categoryItemMap.values()).forEach(({ category, items }) => {
      items.forEach((item) => {
        headerRow1.push(category);
        headerRow2.push(item);
      });
    });

    const dataRows = allDatesIn2026.map((date) => {
      const row: (string | number)[] = [date];
      const entryMap = dateEntryMap.get(date) || new Map();

      Array.from(categoryItemMap.keys()).forEach((key) => {
        const contents = entryMap.get(key) || [];
        row.push(contents.join("; "));
      });

      return row;
    });

    const workbook = XLSX.utils.book_new();
    const worksheetData = [headerRow1, headerRow2, ...dataRows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    worksheet['!merges'] = [];
    let colIndex = 1;
    const categoryGroups = new Map<string, { start: number; count: number }>();

    Array.from(categoryItemMap.values()).forEach(({ category, items }) => {
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, { start: colIndex, count: 0 });
      }
      const group = categoryGroups.get(category)!;
      group.count += items.length;
      colIndex += items.length;
    });

    categoryGroups.forEach((group) => {
      if (group.count > 1) {
        worksheet['!merges']!.push({
          s: { r: 0, c: group.start },
          e: { r: 0, c: group.start + group.count - 1 }
        });
      }
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, "2026 Diary");
    XLSX.writeFile(workbook, `structured-diary-2026.xlsx`);
  };

  return (
    <div>
      <TopNav />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-app-muted">Monthly Summary</p>
          <h1 className="text-xl font-semibold">Reports</h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="rounded-full border border-app-border bg-transparent px-3 py-1 text-xs"
          />
          <button
            onClick={exportExcel}
            className="rounded-full bg-app-accent px-3 py-1 text-xs"
          >
            匯出 Excel
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-app-muted">載入中...</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-app-card p-4">
              <h2 className="mb-4 text-sm font-semibold">Category 佔比</h2>
              <div className="h-56 flex items-center justify-center">
                {stats.list.length === 0 ? (
                  <p className="text-sm text-app-muted">本月沒有紀錄</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.list}
                        dataKey="count"
                        nameKey="name"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {stats.list.map((entry, index) => (
                          <Cell
                            key={entry.id}
                            fill={entry.color || colorPalette[index % colorPalette.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="rounded-2xl bg-app-card p-4">
              <h2 className="mb-4 text-sm font-semibold">Category 統計</h2>
              {stats.list.length === 0 ? (
                <p className="text-sm text-app-muted">本月沒有紀錄</p>
              ) : (
                <div className="space-y-3">
                  {stats.list.map((entry, index) => (
                    <div key={entry.id} className="rounded-xl border border-app-border p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: entry.color || colorPalette[index % colorPalette.length],
                            }}
                          />
                          <p className="text-sm font-semibold">{entry.name}</p>
                        </div>
                        <p className="text-xs text-app-muted">
                          {entry.count} 次 ({((entry.count / stats.total) * 100).toFixed(0)}%)
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-app-muted">
                        {entry.items.map(([name, count]) => (
                          <span key={name} className="rounded-full border border-app-border px-2 py-1">
                            {name} · {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-app-card p-4">
            <h2 className="mb-4 text-sm font-semibold">最近紀錄 Preview</h2>
            {stats.list.length === 0 ? (
              <p className="text-sm text-app-muted">本月沒有紀錄</p>
            ) : (
              <div className="space-y-4">
                {stats.list.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-app-border p-3">
                    <p className="text-sm font-semibold">{entry.name}</p>
                    {(recentEntriesByCategory.get(entry.id) ?? []).length === 0 ? (
                      <p className="mt-2 text-xs text-app-muted">此類別沒有紀錄</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {(recentEntriesByCategory.get(entry.id) ?? []).slice(0, 5).map((item) => (
                          <div key={item.id} className="flex items-start gap-2 rounded-lg bg-app-bg px-3 py-2">
                            <span className="shrink-0 rounded-full border border-app-border px-2 py-0.5 text-xs text-app-muted">
                              {item.item?.emoji ? `${item.item.emoji} ` : ""}{item.item?.name ?? ""}
                            </span>
                            <p className="min-w-0 flex-1 text-sm">
                              {item.content.length > 80 ? `${item.content.slice(0, 80)}...` : item.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
