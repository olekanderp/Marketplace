import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { startSession } from "@/lib/auth/session";
import { ApiError, handle, jsonOk, readJson } from "@/lib/http";
import { serializeUserSelf } from "@/lib/serialize";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  return handle(async () => {
    const input = loginSchema.parse(await readJson(request));
    const { User } = db();

    const user = await User.findOne({ where: { email: input.email } });
    const ok = user ? await verifyPassword(input.password, user.passwordHash) : false;
    if (!user || !ok) throw new ApiError(401, "Incorrect email or password");
    if (user.status === "removed") {
      throw new ApiError(403, "This account has been removed. Contact the platform team.");
    }
    if (user.status !== "active") {
      throw new ApiError(403, "This account has been suspended. Contact the platform team.");
    }

    await startSession({ userId: user.id, role: user.role, email: user.email });
    return jsonOk({ user: serializeUserSelf(user) });
  });
}
