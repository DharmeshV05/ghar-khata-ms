import { createHouseholdAndJoin } from "@/lib/actions/households";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-2xl font-semibold tracking-tight">Set up your household</h1>
        <p className="text-muted-foreground text-sm">
          This workspace is shared with family members. You can invite people later from settings.
        </p>
        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}
      </div>
      <form action={createHouseholdAndJoin} className="mt-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Household name</Label>
          <Input id="name" name="name" required placeholder="e.g. Sharma family" minLength={2} />
        </div>
        <Button type="submit" className="w-full">
          Create household
        </Button>
      </form>
    </div>
  );
}
