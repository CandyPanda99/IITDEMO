"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const { data: categories } = useCategories();
  const [categoryId, setCategoryId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateError, setDateError] = useState("");

  const hasFilters = categoryId || dateFrom || dateTo;

  const handleExport = () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setDateError("'Date from' must be before 'Date to'");
      return;
    }
    setDateError("");

    const params = new URLSearchParams();
    if (categoryId) params.set("categoryId", categoryId);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    const qs = params.toString();
    window.location.href = `/api/transactions/export${qs ? `?${qs}` : ""}`;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Transactions to CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!hasFilters && (
            <p className="text-sm text-muted-foreground">
              No filters applied — all transactions will be exported.
            </p>
          )}

          <div className="space-y-1">
            <Label>Category (optional)</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => setCategoryId(String(v) === "__all__" ? "" : String(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="dateFrom">Date from (optional)</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="dateTo">Date to (optional)</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {dateError && (
            <p className="text-xs text-red-500">{dateError}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
