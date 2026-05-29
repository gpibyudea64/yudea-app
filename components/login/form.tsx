"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { ButtonGroup } from "../ui/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState } from "react";
import { LoginFormValues, loginSchema } from "@/schemas/auth.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Eye, EyeClosed } from "lucide-react";

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
      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };
  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email and password to access the dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <ButtonGroup className=" w-full">
                  <Input
                    id="password"
                    type={isShow ? "text" : "password"}
                    className="border border-r-0"
                    {...register("password")}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded border border-l-0"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsShow((prev) => !prev);
                    }}
                  >
                    {isShow ? <Eye /> : <EyeClosed />}
                  </Button>
                </ButtonGroup>
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {error && <p>{error}</p>}

            <Button
              type="submit"
              className="w-full mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
