"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createInviteToken } from "@/lib/actions/households";
import { importHouseholdBackup } from "@/lib/actions/backup";
import { createCategory, deleteCategory } from "@/lib/actions/vendors";
import type { HouseholdRole } from "@/lib/household";

type Member = { user_id: string; role: string };
type Category = { id: string; name: string };
type Log = { id: string; action: string; entity_type: string; created_at: string };

type Props = {
  role: HouseholdRole;
  members: Member[];
  categories: Category[];
  logs: Log[];
  inviteBaseUrl: string;
};

export function SettingsClient({ role, members, categories, logs, inviteBaseUrl }: Props) {
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [importJson, setImportJson] = useState("");
  const [catName, setCatName] = useState("");
  const [pending, startTransition] = useTransition();
  const isAdmin = role === "owner" || role === "admin";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Profile, household, backup, and permissions</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Household members</CardTitle>
          <CardDescription>Your role: {role}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {members.map((m) => (
              <li key={m.user_id} className="flex justify-between">
                <span className="font-mono text-xs">{m.user_id.slice(0, 8)}…</span>
                <span className="text-muted-foreground">{m.role}</span>
              </li>
            ))}
          </ul>
          {isAdmin && (
            <form
              className="mt-4 flex gap-2"
              action={async (fd) => {
                const res = await createInviteToken(fd);
                if ("error" in res && res.error) toast.error(res.error);
                else if (res.token) {
                  setInviteToken(res.token);
                  toast.success("Invite created");
                }
              }}
            >
              <Input name="email" type="email" placeholder="Email (optional)" className="flex-1" />
              <Button type="submit">Create invite</Button>
            </form>
          )}
          {inviteToken && (
            <div className="text-muted-foreground mt-2 space-y-1 break-all text-xs">
              <p>
                New member: {inviteBaseUrl}/signup?invite={inviteToken}
              </p>
              <p>
                Existing account: {inviteBaseUrl}/login?invite={inviteToken}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-1 text-sm">
              {categories.map((c) => (
                <li key={c.id} className="flex justify-between">
                  {c.name}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-7"
                    onClick={() =>
                      startTransition(async () => {
                        const res = await deleteCategory(c.id);
                        if ("error" in res && res.error) toast.error(res.error);
                      })
                    }
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="New category" />
              <Button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await createCategory({ name: catName });
                    if ("error" in res && res.error) toast.error(res.error);
                    else {
                      setCatName("");
                      toast.success("Category added");
                    }
                  })
                }
              >
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Backup & restore</CardTitle>
          <CardDescription>JSON export of household data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <a
            href="/api/backup/export"
            download
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
          >
            Download backup
          </a>
          {isAdmin && (
            <>
              <div className="space-y-2">
                <Label>Paste backup JSON (categories & vendors)</Label>
                <Textarea rows={6} value={importJson} onChange={(e) => setImportJson(e.target.value)} />
              </div>
              <Button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await importHouseholdBackup(importJson);
                    if ("error" in res && res.error) toast.error(res.error);
                    else toast.success(res.message ?? "Imported");
                  })
                }
              >
                Import
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Activity log</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex justify-between gap-2">
                <span>
                  {l.action} {l.entity_type}
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {new Date(l.created_at).toLocaleString("en-IN")}
                </span>
              </li>
            ))}
            {!logs.length && <li className="text-muted-foreground">No activity yet.</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
