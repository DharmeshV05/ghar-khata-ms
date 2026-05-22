"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatInr } from "@/lib/format";
import { createVendor, updateVendor, deleteVendor } from "@/lib/actions/vendors";
import { vendorFormSchema } from "@/lib/validations/purchase";

export type VendorRow = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  pending: number;
};

type Props = {
  vendors: VendorRow[];
  canEdit: boolean;
  canDelete: boolean;
};

export function VendorsClient({ vendors, canEdit, canDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<VendorRow | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  function resetForm(v?: VendorRow | null) {
    setName(v?.name ?? "");
    setPhone(v?.phone ?? "");
    setAddress(v?.address ?? "");
    setNotes(v?.notes ?? "");
  }

  async function save() {
    const payload = vendorFormSchema.safeParse({
      name,
      phone: phone || null,
      address: address || null,
      notes: notes || null,
    });
    if (!payload.success) {
      toast.error(payload.error.message);
      return;
    }
    const res = edit
      ? await updateVendor(edit.id, payload.data)
      : await createVendor(payload.data);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(edit ? "Vendor updated" : "Vendor added");
    setOpen(false);
    setEdit(null);
    resetForm();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground text-sm">Shops and monthly credit accounts</p>
        </div>
        {canEdit && (
          <>
            <Button
              onClick={() => {
                resetForm();
                setOpen(true);
              }}
            >
              Add vendor
            </Button>
            <Dialog
              open={open || !!edit}
              onOpenChange={(o) => {
                if (!o) {
                  setOpen(false);
                  setEdit(null);
                  resetForm();
                }
              }}
            >
              <DialogContent>
              <DialogHeader>
                <DialogTitle>{edit ? "Edit vendor" : "New vendor"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                </div>
                <Button className="w-full" onClick={() => void save()}>
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((v) => (
          <Card key={v.id} className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{v.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {v.phone && <p className="text-muted-foreground">{v.phone}</p>}
              <p>
                Pending balance:{" "}
                <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-300">
                  {formatInr(v.pending)}
                </span>
              </p>
              {canEdit && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEdit(v);
                      resetForm(v);
                    }}
                  >
                    Edit
                  </Button>
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={async () => {
                        if (!confirm("Delete vendor?")) return;
                        const res = await deleteVendor(v.id);
                        if ("error" in res && res.error) toast.error(res.error);
                        else toast.success("Deleted");
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {!vendors.length && (
          <p className="text-muted-foreground col-span-full text-sm">No vendors yet.</p>
        )}
      </div>
    </div>
  );
}
