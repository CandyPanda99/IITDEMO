"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { CategoryManager } from "@/components/transactions/CategoryManager";
import { ExportDialog } from "@/components/transactions/ExportDialog";

export default function TransactionsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold flex-1">Transactions</h1>
        <Button onClick={() => setExportOpen(true)} variant="outline">
          Export CSV
        </Button>
        <Button onClick={() => setCatOpen(true)} variant="outline">
          Manage Categories
        </Button>
        <Button onClick={() => setAddOpen(true)}>+ Add Transaction</Button>
      </div>

      <TransactionList />

      {/* Add transaction dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm onSuccess={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Category manager */}
      <CategoryManager open={catOpen} onOpenChange={setCatOpen} />

      {/* Export dialog */}
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
