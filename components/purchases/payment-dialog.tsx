"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addPayment } from "@/lib/actions/payments";
import { formatInr } from "@/lib/format";

type Props = {
  purchaseId: string;
  itemName: string;
  balanceDue: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PaymentDialog({ purchaseId, itemName, balanceDue, open, onOpenChange }: Props) {
  const [amount, setAmount] = useState(String(balanceDue));
  const [method, setMethod] = useState<"CASH" | "UPI" | "CARD" | "OTHER">("CASH");
  const [loading, setLoading] = useState(false);

  const remaining = Math.max(0, balanceDue - (Number(amount) || 0));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await addPayment({
      purchase_id: purchaseId,
      amount: Number(amount),
      method,
    });
    setLoading(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Payment recorded");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment — {itemName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Total due: <strong>{formatInr(balanceDue)}</strong>
          </p>
          <div className="space-y-2">
            <Label htmlFor="amt">Amount paid</Label>
            <Input
              id="amt"
              type="number"
              step="any"
              min={0.01}
              max={balanceDue}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="bg-muted/50 rounded-lg border p-3 text-sm">
            <div className="flex justify-between">
              <span>Remaining after this payment</span>
              <span className="font-semibold tabular-nums">{formatInr(remaining)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Method</Label>
            <Select value={method} onValueChange={(v) => v && setMethod(v as typeof method)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Save payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
