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
        {current?.name ?? "Household"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {households.map((h) => (
          <DropdownMenuItem
            key={h.id}
            onSelect={() => {
              startTransition(() => {
                void setDefaultHousehold(h.id);
              });
            }}
          >
            {h.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
