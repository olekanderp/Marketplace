import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { startSession } from "@/lib/auth/session";
import { conflict, handle, jsonOk, readJson } from "@/lib/http";
import { serializeUserSelf } from "@/lib/serialize";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  return handle(async () => {
    const input = registerSchema.parse(await readJson(request));
    const { User, BuyerProfile, SellerProfile } = db();

    const existing = await User.findOne({ where: { email: input.email }, attributes: ["id"] });
    if (existing) throw conflict("An account with this email already exists");

    const user = await User.create({
      email: input.email,
      name: input.name,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      status: "active",
    });

    if (input.role === "buyer") {
      await BuyerProfile.create({ userId: user.id, headline: "", bio: "", mandate: "" });
    } else {
      await SellerProfile.create({ userId: user.id, companyName: input.name });
    }

    await startSession({ userId: user.id, role: user.role, email: user.email });
    return jsonOk({ user: serializeUserSelf(user) }, 201);
  });
}
