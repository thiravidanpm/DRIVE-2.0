"use server";

import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function registerUser(rollNumber: string) {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("roll_number", rollNumber)
      .single();

    if (existingUser) {
      return {
        success: false,
        message: "User with this roll number already exists",
      };
    }

    // Create user without password initially
    const { data, error } = await supabase.from("users").insert([
      {
        roll_number: rollNumber,
        password: null,
      },
    ]);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: "User registered successfully" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function setPassword(
  rollNumber: string,
  password: string
) {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with password
    const { error } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("roll_number", rollNumber);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: "Password set successfully" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function loginUser(
  rollNumber: string,
  password: string
) {
  try {
    // Get user from database
    const { data: user, error } = await supabase
      .from("users")
      .select("id, roll_number, password")
      .eq("roll_number", rollNumber)
      .single();

    if (error || !user) {
      return { success: false, message: "User not found" };
    }

    // Check if password is set
    if (!user.password) {
      return { success: false, message: "Password not set. Please set a password first." };
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { success: false, message: "Invalid password" };
    }

    return { success: true, message: "Login successful", userId: user.id };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
