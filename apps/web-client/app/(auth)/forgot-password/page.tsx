"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { requestPasswordReset } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Schema = z.object({ email: z.string().email("Enter a valid email") });
type Values = z.infer<typeof Schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    const { error } = await requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message ?? "Could not send reset email");
      return;
    }
    setSent(true);
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Reset password</CardTitle>
        <CardDescription>
          {sent
            ? "If that email exists, a reset link is on its way (check the console)."
            : "Enter your email and we'll send a reset link."}
        </CardDescription>
      </CardHeader>
      {sent ? (
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardFooter>
      ) : (
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!form.formState.errors.email}
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>
            ) : null}
          </CardContent>
          <CardFooter className="mt-6 flex-col gap-3">
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              <Link href="/login" className="text-foreground underline underline-offset-4">
                Back to sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
