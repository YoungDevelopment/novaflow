"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateUserForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role") || "user",
    };

    try {
      const res = await fetch("/api/create-user-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Failed to create user");

      setSuccess("✅ User created successfully!");

      // Reset form on success - safe check
      const form = e.currentTarget;
      if (form && typeof form.reset === "function") {
        form.reset();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create Account</CardTitle>
          <CardDescription>Enter details to create a new user</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" name="firstName" required />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" name="lastName" required />
                </div>
              </div>

              {/* Username - FIXED: Added name attribute */}
              <div className="grid gap-3">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Username"
                  pattern="^[a-zA-Z0-9_-]+$"
                  title="Only letters, numbers, underscores, and hyphens allowed"
                  required
                />
              </div>

              {/* Email */}
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="m@example.com"
                />
              </div>

              {/* Password - FIXED: Added name attribute */}
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  title="Password must be at least 8 characters"
                  required
                  placeholder="********"
                />
              </div>

              {/* Role dropdown */}
              <div className="grid gap-3">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create User"}
              </Button>

              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="p-3 rounded-md bg-green-50 border border-green-200">
                  <p className="text-green-600 text-sm">{success}</p>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
