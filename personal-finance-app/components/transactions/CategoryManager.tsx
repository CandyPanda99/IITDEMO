"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
} from "@/hooks/use-categories";

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryManager({ open, onOpenChange }: CategoryManagerProps) {
  const { data: categories } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const [newName, setNewName] = useState("");

  const defaultCategories = categories?.filter((c) => c.type === "DEFAULT") ?? [];
  const customCategories = categories?.filter((c) => c.type === "CUSTOM") ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createCategory.mutateAsync(newName.trim());
      toast.success("Category created");
      setNewName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create category");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast.success("Category deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Manage Categories</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Default categories */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Default
            </h3>
            <div className="flex flex-wrap gap-2">
              {defaultCategories.map((cat) => (
                <Badge key={cat.id} variant="secondary">
                  {cat.name}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Custom categories */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Custom
            </h3>
            {customCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No custom categories yet.</p>
            ) : (
              <div className="space-y-2">
                {customCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between">
                    <span className="text-sm">{cat.name}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(cat.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Add new category */}
          <form onSubmit={handleCreate} className="space-y-3">
            <h3 className="text-sm font-semibold">Add Custom Category</h3>
            <div className="space-y-1">
              <Label htmlFor="new-category-name">Name</Label>
              <Input
                id="new-category-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
              />
            </div>
            <Button
              type="submit"
              disabled={createCategory.isPending || !newName.trim()}
              className="w-full"
            >
              {createCategory.isPending ? "Creating..." : "Create Category"}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
