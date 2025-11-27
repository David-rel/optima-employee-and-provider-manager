"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone_number: string | null;
  location: string | null;
  user_image_url: string | null;
  role: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [userImageUrl, setUserImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/user/get-profile");
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        setProfile(data.user);
        setName(data.user.name || "");
        setPhoneNumber(data.user.phone_number || "");
        setLocation(data.user.location || "");
        const imageUrl = data.user.user_image_url || "";
        setUserImageUrl(imageUrl);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/user/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to upload image");
        setUploadingImage(false);
        return;
      }

      // Set the uploaded image URL
      setUserImageUrl(data.url);
      setSuccess(
        "Image uploaded successfully! Click 'Save Changes' to update your profile."
      );

      // Auto-save the image URL to profile
      const updateResponse = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone_number: phoneNumber.trim() || null,
          location: location.trim() || null,
          user_image_url: data.url,
        }),
      });

      if (updateResponse.ok) {
        await update(); // Refresh session
        setSuccess("Profile picture updated successfully!");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    // Validate password if changing
    if (newPassword) {
      if (newPassword.length < 8) {
        setError("New password must be at least 8 characters long");
        setSaving(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match");
        setSaving(false);
        return;
      }
    }

    try {
      const updateData: any = {
        name: name.trim(),
        phone_number: phoneNumber.trim() || null,
        location: location.trim() || null,
        user_image_url: userImageUrl.trim() || null,
      };

      // Only include password fields if new password is provided
      if (newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      const response = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update profile");
        setSaving(false);
        return;
      }

      setSuccess("Profile updated successfully!");

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Update session to reflect changes (especially image)
      await update();

      // Reload profile to get updated data
      const profileResponse = await fetch("/api/user/get-profile");
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData.user);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-red-600">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <h1 className="text-3xl font-bold text-[#003366] mb-6">Settings</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-slate-500">
              Email cannot be changed
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#23a5fe] focus:border-transparent"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              maxLength={20}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#23a5fe] focus:border-transparent"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={255}
              placeholder="City, State"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#23a5fe] focus:border-transparent"
            />
          </div>

          {/* Profile Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Profile Picture
            </label>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <img
                  src={userImageUrl || "/default.svg"}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-slate-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/default.svg";
                  }}
                />
              </div>
              <div className="shrink-0">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  <div className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004488] transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-block">
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                  </div>
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  Maximum file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
                </p>
              </div>
            </div>
          </div>

          {/* Role (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Role
            </label>
            <input
              type="text"
              value={
                profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
              }
              disabled
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          </div>

          {/* Email Verified Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Verified
            </label>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.email_verified
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {profile.email_verified ? "Verified" : "Not Verified"}
              </span>
            </div>
          </div>

          {/* Password Change Section */}
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-xl font-semibold text-[#003366] mb-4">
              Change Password
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Leave blank if you don&apos;t want to change your password
            </p>

            {/* Current Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#23a5fe] focus:border-transparent"
              />
            </div>

            {/* New Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#23a5fe] focus:border-transparent"
              />
              <p className="mt-1 text-xs text-slate-500">
                Must be at least 8 characters long
              </p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#23a5fe] focus:border-transparent"
              />
            </div>
          </div>

          {/* Account Info (Read-only) */}
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-xl font-semibold text-[#003366] mb-4">
              Account Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Created At
                </label>
                <input
                  type="text"
                  value={new Date(profile.created_at).toLocaleString()}
                  disabled
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Updated
                </label>
                <input
                  type="text"
                  value={new Date(profile.updated_at).toLocaleString()}
                  disabled
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004488] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
