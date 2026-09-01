import { requireRole } from "@/lib/auth/session";
import { getBuyerProfile } from "@/lib/repo";
import { BuyerProfileForm } from "./profile-form";

export const metadata = { title: "My mandate — N5Deal" };

export default async function ProfilePage() {
  const user = await requireRole("buyer", "/profile");
  const profile = await getBuyerProfile(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Your acquisition mandate</h1>
        <p className="mt-1 text-[15px] text-muted">
          Sellers see this when you contact them, and the marketplace uses it to rank listings by
          Smart Match.
        </p>
      </header>
      <BuyerProfileForm
        initial={{
          headline: profile?.headline ?? "",
          bio: profile?.bio ?? "",
          mandate: profile?.mandate ?? "",
          targetSectors: profile?.targetSectors ?? [],
          targetJurisdictions: profile?.targetJurisdictions ?? [],
          ticketMin: profile?.ticketMin ?? null,
          ticketMax: profile?.ticketMax ?? null,
          currency: profile?.currency ?? "USD",
        }}
      />
    </div>
  );
}
