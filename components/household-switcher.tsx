"use client";

import { useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setDefaultHousehold } from "@/lib/actions/households";
import type { HouseholdSummary } from "@/lib/household";
import { Check, ChevronDown } from "lucide-react";

type Props = {
  households: HouseholdSummary[];
  currentId: string;
};

export function HouseholdSwitcher({ households, currentId }: Props) {
  const [pending, startTransition] = useTransition();
  const current = households.find((h) => h.id === currentId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
      >
        <span className="max-w-[140px] truncate">{current?.name ?? "Household"}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {households.map((h) => (
          <DropdownMenuItem
            key={h.id}
            onSelect={() => {
              if (h.id !== currentId) {
                startTransition(() => {
                  void setDefaultHousehold(h.id);
                });
              }
            }}
            className="flex items-center justify-between"
          >
            <span className="truncate">{h.name}</span>
            {h.id === currentId && <Check className="h-4 w-4 shrink-0 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
