"use client";

import { useEffect, useRef, useState } from "react";
import TopNav from "@/components/TopNav";
import type { Category, Item } from "@/lib/types";

import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

const LS_CATEGORIES = "sd_categories_v1";


export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newItemName, setNewItemName] = useState<Record<string, string>>({});


  // ✅ 哪個 item 的 emoji picker 正在打開
  const [emojiPickerForItemId, setEmojiPickerForItemId] = useState<string | null>(null);

  // 用來做「點外面關閉」
  const pickerWrapRef = useRef<HTMLDivElement | null>(null);

  // -----------------------------
  // Mock initial load
  // -----------------------------
  useEffect(() => {
    const raw = localStorage.getItem(LS_CATEGORIES);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        setCategories(saved);
        setLoading(false);
        return;
      } catch {}
    }
  
    const mockCategories: Category[] = [
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
  
    setCategories(mockCategories);
    setLoading(false);
  }, []);
  
  useEffect(() => {
    if (loading) return;
    localStorage.setItem(LS_CATEGORIES, JSON.stringify(categories));
  }, [categories, loading]);

  // 點外面關閉 emoji picker
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

  // -----------------------------
  // Category actions (mock)
  // -----------------------------
  const addCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;

    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name,
      isActive: true,
      order: categories.length + 1,
      items: [],
    };

    setCategories((prev) => [...prev, newCategory]);
    setNewCategoryName("");
  };

  const updateCategory = (categoryId: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, ...updates } : cat))
    );
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

  // -----------------------------
  // Item actions (mock)
  // -----------------------------
  const addItem = (categoryId: string) => {
    const name = newItemName[categoryId]?.trim();
    if (!name) return;

    const id = `item_${Date.now()}`;

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: [
                ...(cat.items ?? []),
                {
                  id,
                  name,
                  emoji: "✨",
                  isActive: true,
                  order: (cat.items?.length ?? 0) + 1,
                } as any,
              ],
            }
          : cat
      )
    );


    setNewItemName((prev) => ({ ...prev, [categoryId]: "" }));
  };

  const updateItem = (categoryId: string, itemId: string, updates: Partial<Item>) => {
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
                      onClick={() => updateCategory(category.id, { isActive: !category.isActive })}
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
                                // emoji-mart 回傳物件，native 是實際 emoji 字元
                                const chosen = e.native as string;

// 1) 仍可保留 itemEmoji（如果你還想用）
// setItemEmoji((prev) => ({ ...prev, [item.id]: chosen }));

// 2) ✅ 最重要：把 emoji 存進 item 本身（存在 categories 裡）
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
                        >
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

      <p className="mt-4 text-xs text-app-muted">
        目前為 mock data（Route 2）：emoji picker 使用全 emoji 清單，之後可存 DB。
      </p>
    </div>
  );
}

