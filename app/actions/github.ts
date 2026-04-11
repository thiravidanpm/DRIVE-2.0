"use server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER || "";
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || "";

interface InviteResult {
  success: boolean;
  message: string;
  invitee?: string;
}

export async function inviteCollaborator(usernameOrEmail: string): Promise<InviteResult> {
  try {
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
      return {
        success: false,
        message: "GitHub integration not configured. Set GITHUB_TOKEN, GITHUB_REPO_OWNER, and GITHUB_REPO_NAME in .env.local",
      };
    }

    const input = usernameOrEmail.trim();
    if (!input) {
      return { success: false, message: "Please enter a GitHub username or email" };
    }

    // GitHub API: Add collaborator by username
    // If input is an email, we first need to find the username
    let username = input;

    if (input.includes("@")) {
      // Search for user by email
      const searchRes = await fetch(
        `https://api.github.com/search/users?q=${encodeURIComponent(input)}+in:email`,
        {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      if (!searchRes.ok) {
        return { success: false, message: "Failed to search GitHub users" };
      }

      const searchData = await searchRes.json();
      if (!searchData.items || searchData.items.length === 0) {
        return {
          success: false,
          message: `No GitHub user found with email "${input}". Try their GitHub username instead.`,
        };
      }

      username = searchData.items[0].login;
    }

    // Invite as collaborator
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/collaborators/${encodeURIComponent(username)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ permission: "push" }),
      }
    );

    if (res.status === 201) {
      return {
        success: true,
        message: `Invitation sent to @${username}! They'll receive an email to accept.`,
        invitee: username,
      };
    } else if (res.status === 204) {
      return {
        success: true,
        message: `@${username} is already a collaborator on this repo.`,
        invitee: username,
      };
    } else if (res.status === 404) {
      return {
        success: false,
        message: `GitHub user "${username}" not found. Check the username and try again.`,
      };
    } else if (res.status === 403) {
      return {
        success: false,
        message: "Permission denied. The GitHub token may lack repo admin permissions.",
      };
    } else {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `GitHub API error (${res.status})`,
      };
    }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to invite collaborator" };
  }
}

export async function getCollaborators(): Promise<{
  success: boolean;
  message?: string;
  data?: { login: string; avatar_url: string; permissions: any }[];
}> {
  try {
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
      return { success: false, message: "GitHub integration not configured" };
    }

    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/collaborators`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (!res.ok) {
      return { success: false, message: `GitHub API error (${res.status})` };
    }

    const data = await res.json();
    const collaborators = data.map((c: any) => ({
      login: c.login,
      avatar_url: c.avatar_url,
      permissions: c.permissions,
    }));

    return { success: true, data: collaborators };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function removeCollaborator(username: string): Promise<InviteResult> {
  try {
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
      return { success: false, message: "GitHub integration not configured" };
    }

    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/collaborators/${encodeURIComponent(username)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (res.status === 204) {
      return { success: true, message: `@${username} removed from collaborators.` };
    } else {
      return { success: false, message: `Failed to remove @${username} (${res.status})` };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
