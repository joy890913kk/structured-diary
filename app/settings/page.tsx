"use client";

import { useEffect, useRef, useState } from "react";
import TopNav from "@/components/TopNav";
import type { Category, Item } from "@/lib/types";

import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newItemName, setNewItemName] = useState<Record<string, string>>({});

  const [emojiPickerForItemId, setEmojiPickerForItemId] = useState<string | null>(null);
  const pickerWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoading(true);
        const res = await fetch("/api/categories?includeInactive=true");
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories:", error);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!emojiPickerForItemId) return;
      if (!pickerWrapRef.current) return;
      if (!pickerWrapRef.current.contains(e.target as Node)) {
        setEmojiPickerForItemId(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [emojiPickerForItemId]);

  const reloadCategories = async () => {
    try {
      const res = await fetch("/api/categories?includeInactive=true");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to reload categories:", error);
    }
  };

  const addCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color: "#3b82f6" }),
      });
      await res.json();
      setNewCategoryName("");
      await reloadCategories();
    } catch (error) {
      console.error("Failed to add category:", error);
      alert("Failed to add category");
    }
  };

  const updateCategory = async (categoryId: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, ...updates } : cat))
    );

    try {
      await fetch(`/api/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  const moveCategory = (index: number, direction: -1 | 1) => {
    setCategories((prev) => {
      const next = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const addItem = async (categoryId: string) => {
    const name = newItemName[categoryId]?.trim();
    if (!name) return;

    try {
      await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, name }),
      });

      setNewItemName((prev) => ({ ...prev, [categoryId]: "" }));
      await reloadCategories();
    } catch (error) {
      console.error("Failed to add item:", error);
      alert("Failed to add item");
    }
  };

  const updateItem = async (categoryId: string, itemId: string, updates: Partial<Item>) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items?.map((it) => (it.id === itemId ? { ...it, ...updates } : it)),
            }
          : cat
      )
    );

    try {
      await fetch(`/api/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const moveItem = (category: Category, index: number, direction: -1 | 1) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== category.id) return cat;
        const items = [...(cat.items ?? [])];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= items.length) return cat;
        [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
        return { ...cat, items };
      })
    );
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
            className="flex-1 rounded-full border border-app-border bg-transparent px-3 py-2 text-base"
          />
          <button onClick={addCategory} className="rounded-full bg-app-accent px-4 py-2 text-base">
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
                      onChange={(event) => updateCategory(category.id, { name: event.target.value })}
                      className="rounded-full border border-app-border bg-transparent px-3 py-1 text-base"
                    />
                    <button
                      onClick={() => {
                        const newIsActive = !category.isActive;
                        updateCategory(category.id, { isActive: newIsActive });
                        if (!newIsActive) {
                          category.items?.forEach((item) => {
                            updateItem(category.id, item.id, { isActive: false });
                          });
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-app-muted"
                    >
                      <span className={`h-2 w-2 rounded-full ${category.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
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
                      className="flex items-center gap-2 rounded-lg bg-app-bg px-3 py-2"
                    >
                      {/* Left: emoji button + input */}
                      <div className="relative flex min-w-0 flex-1 items-center gap-2">
                        <button
                          type="button"
                          className="text-lg"
                          title="選 emoji"
                          onClick={() =>
                            setEmojiPickerForItemId((prev) => (prev === item.id ? null : item.id))
                          }
                        >
                         {(item as any).emoji ?? "✨"}
                        </button>

                        {emojiPickerForItemId === item.id && (
                          <div
                            ref={pickerWrapRef}
                            className="absolute left-0 top-10 z-20 overflow-hidden rounded-2xl border border-app-border bg-app-card shadow"
                          >
                            <Picker
                              data={data}
                              theme="light"
                              onEmojiSelect={(e: any) => {
                                const chosen = e.native as string;

                                setCategories((prev) =>
                                  prev.map((cat) =>
                                    cat.id === category.id
                                      ? {
                                          ...cat,
                                          items: cat.items?.map((it) =>
                                            it.id === item.id ? ({ ...it, emoji: chosen } as any) : it
                                          ),
                                        }
                                      : cat
                                  )
                                );

                                updateItem(category.id, item.id, { emoji: chosen } as any);
                                setEmojiPickerForItemId(null);
                              }}
                            />
                          </div>
                        )}

                        <input
                          value={item.name}
                          onChange={(event) =>
                            updateItem(category.id, item.id, { name: event.target.value })
                          }
                          className="w-full min-w-0 rounded-full border border-app-border bg-transparent px-3 py-1 text-sm"
                        />
                      </div>

                      {/* Right: actions */}
                      <div className="flex shrink-0 gap-2 text-xs text-app-muted">
                        <button
                          onClick={() =>
                            updateItem(category.id, item.id, { isActive: !item.isActive })
                          }
                          className="flex items-center gap-1"
                        >
                          <span className={`h-2 w-2 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
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
                      setNewItemName((prev) => ({
                        ...prev,
                        [category.id]: event.target.value,
                      }))
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

