import { requireRole } from "@/lib/auth/session";
import { getBuyerProfile, getSellerProfile } from "@/lib/repo";
import { BuyerProfileForm } from "./buyer-profile-form";
import { SellerProfileForm } from "./seller-profile-form";

export const metadata = { title: "My profile — N5Deal" };

export default async function ProfilePage() {
  const user = await requireRole(["buyer", "seller"], "/profile");

  if (user.role === "seller") {
    const profile = await getSellerProfile(user.id);
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Your seller profile</h1>
          <p className="mt-1 text-[15px] text-muted">
            Buyers see this when you contact them about an asset.
          </p>
        </header>
        <SellerProfileForm
          initial={{
            companyName: profile?.companyName ?? user.name,
            about: profile?.about ?? "",
            website: profile?.website ?? "",
          }}
        />
      </div>
    );
  }

  const profile = await getBuyerProfile(user.id);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Your acquisition mandate</h1>
        <p className="mt-1 text-[15px] text-muted">
          Sellers see this when you contact them, and the marketplace uses it to score listings by
          Smart Match. Listings are only scored once at least one field below is filled in.
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
