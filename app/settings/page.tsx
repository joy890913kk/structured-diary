"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import type { Category, Item } from "@/lib/types";

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newItemName, setNewItemName] = useState<Record<string, string>>({});

  const loadCategories = async () => {
    setLoading(true);
    const response = await fetch("/api/categories");
    const data = await response.json();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName }),
    });
    setNewCategoryName("");
    await loadCategories();
  };

  const updateCategory = async (category: Category, updates: Partial<Category>) => {
    await fetch(`/api/categories/${category.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: updates.name ?? category.name,
        color: updates.color ?? category.color,
        isActive: updates.isActive ?? category.isActive,
        order: updates.order ?? category.order,
      }),
    });
    await loadCategories();
  };

  const addItem = async (categoryId: string) => {
    const name = newItemName[categoryId];
    if (!name?.trim()) return;
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, name }),
    });
    setNewItemName((prev) => ({ ...prev, [categoryId]: "" }));
    await loadCategories();
  };

  const updateItem = async (item: Item, updates: Partial<Item>) => {
    await fetch(`/api/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: updates.name ?? item.name,
        isActive: updates.isActive ?? item.isActive,
        order: updates.order ?? item.order,
      }),
    });
    await loadCategories();
  };

  const moveCategory = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const current = categories[index];
    const target = categories[targetIndex];
    await Promise.all([
      updateCategory(current, { order: target.order }),
      updateCategory(target, { order: current.order }),
    ]);
  };

  const moveItem = async (category: Category, index: number, direction: -1 | 1) => {
    const items = category.items ?? [];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const current = items[index];
    const target = items[targetIndex];
    await Promise.all([
      updateItem(current, { order: target.order }),
      updateItem(target, { order: current.order }),
    ]);
  };

  return (
    <div>
      <TopNav />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-app-muted">Settings</p>
          <h1 className="text-xl font-semibold">類別 / 項目管理</h1>
        </div>
      </div>

      <div className="rounded-2xl bg-app-card p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            placeholder="新增類別"
            className="flex-1 rounded-full border border-app-border bg-transparent px-3 py-2 text-sm"
          />
          <button
            onClick={addCategory}
            className="rounded-full bg-app-accent px-4 py-2 text-sm"
          >
            新增
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-app-muted">載入中...</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-app-muted">尚未建立類別。</p>
        ) : (
          <div className="space-y-4">
            {categories.map((category, index) => (
              <div key={category.id} className="rounded-xl border border-app-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={category.name}
                      onChange={(event) =>
                        setCategories((prev) =>
                          prev.map((item) =>
                            item.id === category.id ? { ...item, name: event.target.value } : item
                          )
                        )
                      }
                      onBlur={() => updateCategory(category, { name: category.name })}
                      className="rounded-full border border-app-border bg-transparent px-3 py-1 text-sm"
                    />
                    <button
                      onClick={() => updateCategory(category, { isActive: !category.isActive })}
                      className="text-xs text-app-muted"
                    >
                      {category.isActive ? "停用" : "啟用"}
                    </button>
                  </div>
                  <div className="flex gap-2 text-xs text-app-muted">
                    <button onClick={() => moveCategory(index, -1)}>↑</button>
                    <button onClick={() => moveCategory(index, 1)}>↓</button>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {(category.items ?? []).map((item, itemIndex) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-app-bg px-3 py-2"
                    >
                      <input
                        value={item.name}
                        onChange={(event) =>
                          setCategories((prev) =>
                            prev.map((cat) =>
                              cat.id === category.id
                                ? {
                                    ...cat,
                                    items: cat.items?.map((it) =>
                                      it.id === item.id ? { ...it, name: event.target.value } : it
                                    ),
                                  }
                                : cat
                            )
                          )
                        }
                        onBlur={() => updateItem(item, { name: item.name })}
                        className="rounded-full border border-app-border bg-transparent px-3 py-1 text-xs"
                      />
                      <div className="flex gap-2 text-xs text-app-muted">
                        <button onClick={() => updateItem(item, { isActive: !item.isActive })}>
                          {item.isActive ? "停用" : "啟用"}
                        </button>
                        <button onClick={() => moveItem(category, itemIndex, -1)}>↑</button>
                        <button onClick={() => moveItem(category, itemIndex, 1)}>↓</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    value={newItemName[category.id] ?? ""}
                    onChange={(event) =>
                      setNewItemName((prev) => ({ ...prev, [category.id]: event.target.value }))
                    }
                    placeholder="新增項目"
                    className="flex-1 rounded-full border border-app-border bg-transparent px-3 py-2 text-xs"
                  />
                  <button
                    onClick={() => addItem(category.id)}
                    className="rounded-full bg-app-accent px-3 py-2 text-xs"
                  >
                    新增項目
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
