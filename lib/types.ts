export type Category = {
  id: string;
  name: string;
  order: number;
  color?: string | null;
  isActive: boolean;
  items?: Item[];
};

export type Item = {
  id: string;
  categoryId: string;
  name: string;
  emoji?: string | null;
  order: number;
  isActive: boolean;
};

export type Entry = {
  id: string;
  entryDate: string;
  categoryId: string;
  itemId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  item?: Item;
};
