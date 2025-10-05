import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

interface ClerkAPIErrorItem {
  code: string;
  message: string;
  longMessage?: string;
  meta?: Record<string, unknown>;
}

interface ClerkAPIError extends Error {
  status?: number;
  errors?: ClerkAPIErrorItem[];
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clerk = await clerkClient();

    // Get current user and verify admin role
    const currentUser = await clerk.users.getUser(userId);

    if (
      // currentUser.publicMetadata.role !== "admin" && //AR: Remove admin restriction, only owner can create users now
      currentUser.publicMetadata.role !== "owner"
    ) {
      return NextResponse.json(
        { error: "Forbidden - Not Allowed to create new User" },
        { status: 403 }
      );
    }

    const {
      firstName = "",
      lastName = "",
      email,
      password,
      role,
      username,
    } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Generate or validate username
    let safeUsername: string;

    if (username && typeof username === "string") {
      // Use provided username, sanitize it
      safeUsername = username
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");

      // Validate length
      if (safeUsername.length < 4 || safeUsername.length > 64) {
        return NextResponse.json(
          { error: "Username must be between 4 and 64 characters" },
          { status: 400 }
        );
      }
    } else {
      // Auto-generate from email
      const baseUsername = email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");

      safeUsername = baseUsername;

      // Ensure username is at least 4 characters
      if (safeUsername.length < 4) {
        safeUsername = `user${Date.now().toString().slice(-8)}`;
      }

      // Ensure username is at most 64 characters
      if (safeUsername.length > 64) {
        safeUsername = safeUsername.slice(0, 64);
      }
    }

    // Validate and sanitize role
    const validRole = role === "admin" ? "admin" : "user";

    // Create new user with Clerk (v6 format)
    const newUser = await clerk.users.createUser({
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      username: safeUsername,
      emailAddress: [email.trim()],
      password: password.trim(),
      publicMetadata: { role: validRole },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.emailAddresses[0]?.emailAddress,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: validRole,
      },
    });
  } catch (err: unknown) {
    const error = err as ClerkAPIError;
    console.error("Clerk error:", JSON.stringify(error, null, 2));

    if (error?.errors && Array.isArray(error.errors)) {
      return NextResponse.json(
        { errors: error.errors },
        { status: error.status || 400 }
      );
    }

    if (error?.errors?.[0]?.code === "form_identifier_exists") {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create user. Please try again." },
      { status: 500 }
    );
  }
}
