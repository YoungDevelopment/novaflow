"use client";

import { toast } from "sonner";

export async function createUser(formData: FormData) {
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

    if (!res.ok) {
      // 🧠 Enhanced Clerk error handling
      if (result.error) throw new Error(result.error);

      if (result.errors && Array.isArray(result.errors)) {
        // Pick the most descriptive message available
        const messages = result.errors.map(
          (e: { message?: string; longMessage?: string; code?: string }) =>
            e.longMessage || e.message || e.code
        );
        throw new Error(messages.join(", "));
      }

      throw new Error("Failed to create user");
    }

    toast("✅ User created", {
      description: `${data.email} has been successfully registered.`,
    });

    return { success: true };
  } catch (err: unknown) {
    let message = "An unexpected error occurred.";
    if (err instanceof Error) message = err.message;

    toast("❌ Error creating user", {
      description: message,
    });

    return { success: false, message };
  }
}
