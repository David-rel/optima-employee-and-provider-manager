import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PUT(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      phone_number,
      location,
      user_image_url,
      currentPassword,
      newPassword,
    } = body;

    const userId = parseInt(session.user.id);

    // Get current user data
    const userResult = await query<{
      hashed_password: string;
      name: string;
      phone_number: string | null;
      location: string | null;
      user_image_url: string | null;
    }>(
      "SELECT hashed_password, name, phone_number, location, user_image_url FROM users WHERE id = $1",
      [userId]
    );

    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build update fields
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 1;

    // Update name if provided
    if (name !== undefined && name !== null && name.trim() !== "") {
      if (name.trim().length < 2) {
        return NextResponse.json(
          { error: "Name must be at least 2 characters long" },
          { status: 400 }
        );
      }
      updateFields.push(`name = $${paramCount++}`);
      updateValues.push(name.trim());
    }

    // Update phone number if provided
    if (phone_number !== undefined) {
      const phone = phone_number?.trim() || null;
      if (phone && phone.length > 20) {
        return NextResponse.json(
          { error: "Phone number must be 20 characters or less" },
          { status: 400 }
        );
      }
      updateFields.push(`phone_number = $${paramCount++}`);
      updateValues.push(phone);
    }

    // Update location if provided
    if (location !== undefined) {
      const loc = location?.trim() || null;
      if (loc && loc.length > 255) {
        return NextResponse.json(
          { error: "Location must be 255 characters or less" },
          { status: 400 }
        );
      }
      updateFields.push(`location = $${paramCount++}`);
      updateValues.push(loc);
    }

    // Update user image URL if provided
    if (user_image_url !== undefined) {
      const imgUrl = user_image_url?.trim() || null;
      updateFields.push(`user_image_url = $${paramCount++}`);
      updateValues.push(imgUrl);
    }

    // Handle password change if new password is provided
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to change password" },
          { status: 400 }
        );
      }

      // Validate current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.hashed_password
      );

      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      // Validate new password
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters long" },
          { status: 400 }
        );
      }

      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      updateFields.push(`hashed_password = $${paramCount++}`);
      updateValues.push(hashedPassword);
    }

    // If no fields to update, return success
    if (updateFields.length === 0) {
      return NextResponse.json({
        message: "No changes to update",
      });
    }

    // Add updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add user ID for WHERE clause
    updateValues.push(userId);

    // Build and execute update query
    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(", ")} 
      WHERE id = $${paramCount}
      RETURNING id, name, email, phone_number, location, user_image_url, role, email_verified
    `;

    const result = await query(updateQuery, updateValues);

    return NextResponse.json({
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
