import { Suspense } from "react";
import { redirectIfSignedIn } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — N5Deal" };

export default async function LoginPage() {
  await redirectIfSignedIn();
  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-[14px] text-muted">Welcome back to the marketplace.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
