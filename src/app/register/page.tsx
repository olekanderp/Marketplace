import { RegisterForm } from "./register-form";

export const metadata = { title: "Create an account — N5Deal" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-1 text-[14px] text-muted">
        Join as a buyer to define an acquisition mandate, or as a seller to list assets.
      </p>
      <RegisterForm />
    </div>
  );
}
