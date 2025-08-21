import { api } from "encore.dev/api";
import { userDB } from "./db";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";

export interface DeleteUserByAdminRequest {
  id: number;
}

export interface DeleteUserByAdminResponse {
  success: boolean;
}

// Deletes a user. For admins only.
export const deleteUserByAdmin = api<DeleteUserByAdminRequest, DeleteUserByAdminResponse>(
  { expose: true, method: "DELETE", path: "/users/admin/:id", auth: true },
  async ({ id }) => {
    const auth = getAuthData()!;
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("You do not have permission to delete users.");
    }

    const result = await userDB.exec`DELETE FROM users WHERE id = ${id}`;

    return { success: true };
  }
);
