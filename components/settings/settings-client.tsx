"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createInviteToken } from "@/lib/actions/households";
import { importHouseholdBackup } from "@/lib/actions/backup";
import { createCategory, deleteCategory } from "@/lib/actions/vendors";
import type { HouseholdRole } from "@/lib/household";
import { Copy, Check, Users, Tags, HardDrive, Activity } from "lucide-react";

type Member = { user_id: string; role: string; display_name: string | null };
type Category = { id: string; name: string };
type Log = { id: string; action: string; entity_type: string; created_at: string };

type Props = {
  role: HouseholdRole;
  members: Member[];
  categories: Category[];
  logs: Log[];
  inviteBaseUrl: string;
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0 gap-1"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(`${label} copied`);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

export function SettingsClient({ role, members, categories, logs, inviteBaseUrl }: Props) {
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [importJson, setImportJson] = useState("");
  const [catName, setCatName] = useState("");
  const [pending, startTransition] = useTransition();
  const isAdmin = role === "owner" || role === "admin";

  const signupLink = inviteToken ? `${inviteBaseUrl}/signup?invite=${inviteToken}` : "";
  const loginLink = inviteToken ? `${inviteBaseUrl}/login?invite=${inviteToken}` : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your household, categories, and data
        </p>
      </div>

      <Tabs defaultValue="family">
        <TabsList className="w-full flex-wrap h-auto">
          <TabsTrigger value="family" className="gap-1.5">
            <Users className="h-4 w-4" />
            Family
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="categories" className="gap-1.5">
              <Tags className="h-4 w-4" />
              Categories
            </TabsTrigger>
          )}
          <TabsTrigger value="backup" className="gap-1.5">
            <HardDrive className="h-4 w-4" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="family" className="mt-4 space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Household members</CardTitle>
              <CardDescription>
                Your role: <span className="font-medium capitalize">{role}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {members.map((m) => (
                  <li
                    key={m.user_id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <span className="font-medium">
                      {m.display_name ?? "Member"}
                    </span>
                    <span className="text-muted-foreground capitalize">{m.role}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Invite family</CardTitle>
                <CardDescription>
                  Create a link and share it on WhatsApp — no need to type long URLs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form
                  className="flex flex-col gap-2 sm:flex-row"
                  action={async (fd) => {
                    const res = await createInviteToken(fd);
                    if ("error" in res && res.error) toast.error(res.error);
                    else if (res.token) {
                      setInviteToken(res.token);
                      toast.success("Invite link ready — copy and share");
                    }
                  }}
                >
                  <Input
                    name="email"
                    type="email"
                    placeholder="Their email (optional)"
                    className="flex-1"
                  />
                  <Button type="submit">Create invite link</Button>
                </form>

                {inviteToken && (
                  <div className="space-y-3">
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="mb-2 text-sm font-medium">New to GharKhata?</p>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <p className="text-muted-foreground min-w-0 flex-1 break-all text-xs">
                          {signupLink}
                        </p>
                        <CopyButton text={signupLink} label="Signup link" />
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="mb-2 text-sm font-medium">Already has an account?</p>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <p className="text-muted-foreground min-w-0 flex-1 break-all text-xs">
                          {loginLink}
                        </p>
                        <CopyButton text={loginLink} label="Login link" />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="categories" className="mt-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
                <CardDescription>Group purchases like Groceries, Milk, Bills</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1 text-sm">
                  {categories.map((c) => (
                    <li key={c.id} className="flex justify-between rounded-lg border px-3 py-2">
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
                  {!categories.length && (
                    <li className="text-muted-foreground py-2 text-sm">No categories yet.</li>
                  )}
                </ul>
                <div className="flex gap-2">
                  <Input
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Groceries"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        startTransition(async () => {
                          const res = await createCategory({ name: catName });
                          if ("error" in res && res.error) toast.error(res.error);
                          else {
                            setCatName("");
                            toast.success("Category added");
                          }
                        });
                      }
                    }}
                  />
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
          </TabsContent>
        )}

        <TabsContent value="backup" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Backup & restore</CardTitle>
              <CardDescription>Download or restore your household data as JSON</CardDescription>
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
                    <Label>Paste backup JSON to restore categories & shops</Label>
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
                    Import backup
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent activity</CardTitle>
              <CardDescription>What changed in your household lately</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {logs.map((l) => (
                  <li key={l.id} className="flex justify-between gap-2 rounded-lg border px-3 py-2">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
