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
      fetch("/api/categories"),
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
    const rows = entries.map((entry) => ({
      date: entry.entryDate.slice(0, 10),
      category: entry.category?.name ?? "",
      item: entry.item?.name ?? "",
      content: entry.content,
      created_at: entry.createdAt,
    }));

    const categoryNames = categories.map((category) => category.name);
    const dateMap = new Map<string, Record<string, string[]>>();

    entries.forEach((entry) => {
      const dateKey = entry.entryDate.slice(0, 10);
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {});
      }
      const bucket = dateMap.get(dateKey)!;
      const categoryName = entry.category?.name ?? "";
      if (!bucket[categoryName]) {
        bucket[categoryName] = [];
      }
      bucket[categoryName].push(entry.content);
    });

    const sortedDates = Array.from(dateMap.keys()).sort();

    const gridRows = sortedDates.map((dateKey) => {
      const record = dateMap.get(dateKey)!;
      const row: Record<string, string> = {
        date: formatDate(parseISO(dateKey), "yyyy-MM-dd"),
      };
      categoryNames.forEach((name) => {
        row[name] = record[name]?.join("\n") ?? "";
      });
      return row;
    });

    const workbook = XLSX.utils.book_new();
    const sheet1 = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet1, "Event Log");

    const sheet2 = XLSX.utils.json_to_sheet(gridRows, {
      header: ["date", ...categoryNames],
    });
    XLSX.utils.book_append_sheet(workbook, sheet2, "Structured Diary Grid");

    XLSX.writeFile(workbook, `structured-diary-${month}.xlsx`);
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
      ) : entries.length === 0 ? (
        <p className="text-sm text-app-muted">本月沒有紀錄可供分析。</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-app-card p-4">
              <h2 className="mb-4 text-sm font-semibold">Category 佔比</h2>
              <div className="h-56">
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
              </div>
            </div>
            <div className="rounded-2xl bg-app-card p-4">
              <h2 className="mb-4 text-sm font-semibold">Category 統計</h2>
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
            </div>
          </div>

          <div className="rounded-2xl bg-app-card p-4">
            <h2 className="mb-4 text-sm font-semibold">最近紀錄 Preview</h2>
            <div className="space-y-4">
              {stats.list.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-app-border p-3">
                  <p className="text-sm font-semibold">{entry.name}</p>
                  <div className="mt-2 space-y-2 text-xs text-app-muted">
                    {(recentEntriesByCategory.get(entry.id) ?? []).slice(0, 3).map((item) => (
                      <p key={item.id}>
                        {item.content.length > 60 ? `${item.content.slice(0, 60)}...` : item.content}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
