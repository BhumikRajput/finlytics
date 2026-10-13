"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useCategories, type Category, type CategoryKind } from "@/lib/categories-context";
import { ICON_CHOICES, getCategoryIcon } from "@/lib/category-icons";
import { CATEGORY_LABEL_MAX, FALLBACK_CATEGORY } from "@/lib/default-categories";
import { useTransactions } from "@/lib/transactions-context";
import { useBudget } from "@/lib/budget-context";

function CategoryCard({
  title,
  categories,
  onRename,
  onDelete,
}: {
  title: string;
  categories: Category[];
  onRename: (value: string, label: string) => void;
  onDelete: (c: Category) => void;
}) {
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = (c: Category) => {
    setEditingValue(c.value);
    setDraft(c.label);
  };

  const commitEdit = () => {
    if (editingValue && draft.trim()) onRename(editingValue, draft.trim());
    setEditingValue(null);
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <h2 className="font-display text-[15px] font-semibold text-ink">{title}</h2>

      <ul className="mt-3 divide-y divide-line">
        {categories.map((c) => {
          const Icon = c.icon;
          return (
            <li key={c.value} className="flex items-center gap-3 py-2.5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${c.iconBg}`}>
                <Icon size={16} className={c.iconColor} />
              </div>

              {editingValue === c.value ? (
                <input
                  autoFocus
                  value={draft}
                  maxLength={CATEGORY_LABEL_MAX}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => e.key === "Enter" && commitEdit()}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-2 py-1 text-[13.5px] text-ink outline-none"
                />
              ) : (
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">{c.label}</span>
              )}

              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  c.custom ? "bg-primary-soft text-primary-dark" : "bg-canvas text-ink-faint"
                }`}
              >
                {c.custom ? "Custom" : "Default"}
              </span>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  aria-label={`Edit ${c.label}`}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint hover:bg-canvas hover:text-ink"
                >
                  <Pencil size={14} />
                </button>
                {c.custom && (
                  <button
                    type="button"
                    onClick={() => onDelete(c)}
                    aria-label={`Delete ${c.label}`}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint hover:bg-negative-soft hover:text-negative"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </li>
          );
        })}

        {categories.length === 0 && (
          <li className="py-6 text-center text-[13px] text-ink-faint">No categories yet.</li>
        )}
      </ul>
    </div>
  );
}

export default function CategoriesPage() {
  const { expenseCategories, incomeCategories, addCategory, renameCategory, deleteCategory } =
    useCategories();
  const { reassignCategory } = useTransactions();
  const { mergeCategoryBudget } = useBudget();

  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [group, setGroup] = useState<CategoryKind>("expense");
  const [name, setName] = useState("");
  const [iconIndex, setIconIndex] = useState(0);

  const openModal = () => {
    setGroup("expense");
    setName("");
    setIconIndex(0);
    setModalOpen(true);
  };

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const choice = ICON_CHOICES[iconIndex];
    addCategory({
      label: name.trim(),
      kind: group,
      iconName: choice.name,
      iconBg: choice.iconBg,
      iconColor: choice.iconColor,
    });
    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (!deletingCategory) return;
    const c = deletingCategory;
    // Expense fallback key is "others", income fallback key is "other"
    const fallback = FALLBACK_CATEGORY[c.kind];

    // The three requests run in this order in one shared queue (see use-remote-state.ts),
    // and the server refuses to delete a category that still has transactions or budget.
    reassignCategory(c.value, fallback, c.label);
    if (c.kind === "expense") mergeCategoryBudget(c.value, fallback);
    deleteCategory(c.value);

    setDeletingCategory(null);
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">Categories</h1>
        <button
          type="button"
          onClick={openModal}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-primary-dark sm:px-4"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span className="hidden sm:inline">Add Category</span>
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <CategoryCard
          title="Expense Categories"
          categories={expenseCategories}
          onRename={renameCategory}
          onDelete={setDeletingCategory}
        />
        <CategoryCard
          title="Income Categories"
          categories={incomeCategories}
          onRename={renameCategory}
          onDelete={setDeletingCategory}
        />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-xl shadow-ink/10">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[16px] font-semibold text-ink">Add Category</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:bg-canvas hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-[13px] font-medium text-ink-muted">Type</label>
                <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-canvas p-1">
                  <button
                    type="button"
                    onClick={() => setGroup("expense")}
                    className={`rounded-md py-1.5 text-[13px] font-medium transition-colors ${
                      group === "expense" ? "bg-surface text-ink shadow-sm" : "text-ink-faint"
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroup("income")}
                    className={`rounded-md py-1.5 text-[13px] font-medium transition-colors ${
                      group === "income" ? "bg-surface text-ink shadow-sm" : "text-ink-faint"
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="cat-name" className="text-[13px] font-medium text-ink-muted">
                  Name
                </label>
                <input
                  id="cat-name"
                  type="text"
                  placeholder="e.g. Pet Care"
                  maxLength={CATEGORY_LABEL_MAX}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-[13.5px] text-ink outline-none placeholder:text-ink-faint"
                />
              </div>

              <div>
                <label className="text-[13px] font-medium text-ink-muted">Icon</label>
                <div className="mt-1.5 grid max-h-44 grid-cols-6 gap-2 overflow-y-auto p-1">
                  {ICON_CHOICES.map((choice, idx) => {
                    const Icon = getCategoryIcon(choice.name);
                    return (
                      <button
                        key={choice.name}
                        type="button"
                        onClick={() => setIconIndex(idx)}
                        aria-label={`Select ${choice.name} icon`}
                        className={`flex h-9 w-9 items-center justify-center rounded-full ${choice.iconBg} ${
                          iconIndex === idx ? "ring-2 ring-primary ring-offset-1 ring-offset-surface" : ""
                        }`}
                      >
                        <Icon size={16} className={choice.iconColor} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-canvas"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-xl shadow-ink/10">
            <h2 className="font-display text-[16px] font-semibold text-ink">
              Delete &ldquo;{deletingCategory.label}&rdquo;?
            </h2>
            <p className="mt-1.5 text-[13px] text-ink-muted">
              Existing transactions in this category will be moved to Others
              {deletingCategory.kind === "expense" ? ", and its budget will be added to Others" : ""}.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-canvas"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-negative px-4 py-2 text-[13px] font-medium text-white hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
