"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState } from "react";
import { LoginFormValues, loginSchema } from "@/schemas/auth.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { persistAuthSession } from "@/lib/auth-session";
import { getDefaultDashboardPath, normalizeAppRole } from "@/lib/rbac";
import { getSession, signIn } from "next-auth/react";
import { Eye, EyeClosed, Church } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [isShow, setIsShow] = useState(false);
  const [error, setError] = useState("");

  const adminForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = adminForm;

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
        return;
      }

      const session = await getSession();
      if (session?.user) {
        const role = normalizeAppRole(session.user.role);
        persistAuthSession({
          user: {
            id: session.user.id,
            email: session.user.email ?? undefined,
            name: session.user.name ?? undefined,
            role,
          },
        });
        router.replace(getDefaultDashboardPath(role));
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-sm sm:max-w-md animate-in fade-in zoom-in-95 duration-300">
        {/* Brand header - visible on all screen sizes */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg sm:h-16 sm:w-16 sm:rounded-3xl">
            <Church className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            GPIB Yudea
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sistem Informasi Warga Jemaat
          </p>
        </div>

        <Card className="border-border/60 shadow-xl sm:rounded-2xl">
          <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-lg sm:text-xl">Login</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Masukkan email dan password untuk mengakses dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-4 sm:gap-5">
                <div className="grid gap-1.5 sm:gap-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    className="h-11 sm:h-10"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 sm:text-sm">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-1.5 sm:gap-2">
                  <Label htmlFor="password" className="text-xs sm:text-sm">
                    Password
                  </Label>
                  <div className="flex">
                    <Input
                      id="password"
                      type={isShow ? "text" : "password"}
                      className="h-11 rounded-r-none border-r-0 sm:h-10"
                      {...register("password")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0 rounded-l-none border-l-0 sm:h-10 sm:w-10"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsShow((prev) => !prev);
                      }}
                    >
                      {isShow ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeClosed className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 sm:text-sm">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive sm:mt-4 sm:text-sm">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="mt-4 h-11 w-full text-sm sm:mt-6 sm:h-10"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Logging in...
                  </span>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground sm:mt-8">
          &copy; {new Date().getFullYear()} GPIB Yudea. All rights reserved.
        </p>
      </div>
    </div>
  );
}
