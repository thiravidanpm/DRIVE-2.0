"use server";

import { supabase } from "@/lib/supabase";

// Get all users
export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Get single user
export async function getUserById(userId: number) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Delete user
export async function deleteUser(userId: number) {
  try {
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Update user (admin can update any user)
export async function updateUserDetails(
  userId: number,
  updates: {
    roll_number?: string;
    password?: string;
  }
) {
  try {
    const { error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .eq("id", userId);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Get user statistics
export async function getUserStatistics() {
  try {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id");

    const { data: scores, error: scoresError } = await supabase
      .from("scores")
      .select("id");

    const { data: progress, error: progressError } = await supabase
      .from("progress")
      .select("id");

    if (usersError || scoresError || progressError) {
      return { 
        success: false, 
        message: usersError?.message || scoresError?.message || progressError?.message 
      };
    }

    return {
      success: true,
      data: {
        totalUsers: users?.length || 0,
        totalScores: scores?.length || 0,
        totalProgress: progress?.length || 0,
      },
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Search users
export async function searchUsers(query: string) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .or(`roll_number.ilike.%${query}%,id.eq.${query}`)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Get user with scores
export async function getUserWithScores(userId: number) {
  try {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    const { data: scoresData, error: scoresError } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", userId);

    const { data: progressData, error: progressError } = await supabase
      .from("progress")
      .select("*")
      .eq("user_id", userId);

    if (userError) {
      return { success: false, message: userError.message };
    }

    return {
      success: true,
      data: {
        user: userData,
        scores: scoresData || [],
        progress: progressData || [],
      },
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Delete user and all associated data
export async function deleteUserWithData(userId: number) {
  try {
    // Delete scores
    await supabase.from("scores").delete().eq("user_id", userId);

    // Delete progress
    await supabase.from("progress").delete().eq("user_id", userId);

    // Delete user
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: "User and all data deleted" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Export all users as JSON
export async function exportUsers() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
