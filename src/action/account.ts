"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { IUser, IOrganization_member, IEmergencyContact } from "@/interface";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { accountLogger } from '@/lib/logger';
interface UserProfile extends Partial<IUser> {
  email?: string;
}

interface AccountData {
  user: UserProfile;
  organizationMember: IOrganization_member | null;
}

interface Base64UploadData {
  base64Data: string;       // Cropped+compressed → goes to mass-profile/thumb/
  fileName: string;
  fileType: string;
  fileSize: number;
  originalBase64Data?: string; // Full original photo (pre-crop) → goes to mass-profile/original/
  originalFileType?: string;
}

// Get current user account data
export async function getAccountData(): Promise<{
  success: boolean;
  data?: AccountData;
  message?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Get user profile data
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      accountLogger.error('Profile error:', profileError);
    }

    // Read org_id cookie to determine which organization context the user is in
    const cookieStore = await cookies();
    const activeOrgIdStr = cookieStore.get('org_id')?.value;
    // Gunakan string langsung - parseInt akan NaN jika org_id adalah UUID
    const activeOrgId = activeOrgIdStr || null;

    // Gunakan admin client untuk bypass RLS saat join ke organizations
    const adminClient = createAdminClient();

    let orgMemberQuery = adminClient
      .from('organization_members')
      .select(`
        *,
        organization:organizations(*),
        departments:departments!organization_members_department_id_fkey(*),
        positions(*),
        role:system_roles(*),
        user:user_profiles(*)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (activeOrgId) {
      orgMemberQuery = orgMemberQuery.eq('organization_id', activeOrgId);
    }

    const { data: orgMember, error: orgMemberError } = await orgMemberQuery
      .limit(1)
      .maybeSingle();

    if (orgMemberError) {
      accountLogger.error('Org member error:', orgMemberError.message, orgMemberError.details);
    }

    const normalizedUserProfile: UserProfile = userProfile ? { ...userProfile } : {};

    const accountData: AccountData = {
      user: {
        ...normalizedUserProfile,
        email: user.email,
      },
      organizationMember: orgMember ?? null,
    };

    return {
      success: true,
      data: accountData,
    };
  } catch (error: unknown) {
    accountLogger.error('Get account data error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch account data',
    };
  }
}

// Update user profile
export async function updateUserProfile(profileData: Partial<UserProfile>): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Prepare update data (exclude email and id)
    const { email, ...updateData } = profileData;

    // Handle emergency_contact - ensure it's properly structured
    if (updateData.emergency_contact) {
      // If all fields are empty, set to null
      const ec = updateData.emergency_contact as IEmergencyContact;
      if (!ec.name && !ec.relationship && !ec.phone && !ec.email) {
        updateData.emergency_contact = null;
      }
    }

    // Update user profile in user_profiles table
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return {
        success: false,
        message: updateError.message || 'Failed to update profile',
      };
    }

    // If email is being updated, update it in auth
    if (email && email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: email,
      });

      if (emailError) {
        return {
          success: false,
          message: `Profile updated but email update failed: ${emailError.message}`,
        };
      }
    }

    revalidatePath('/account');
    return {
      success: true,
      message: 'Profile updated successfully',
    };
  } catch (error: unknown) {
    accountLogger.error('Update profile error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}

// Update profile photo
export async function updateProfilePhoto(photoUrl: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Update profile photo URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        profile_photo_url: photoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return {
        success: false,
        message: updateError.message || 'Failed to update profile photo',
      };
    }

    revalidatePath('/account');
    return {
      success: true,
      message: 'Profile photo updated successfully',
    };
  } catch (error: unknown) {
    accountLogger.error('Update profile photo error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update profile photo',
    };
  }
}

// Change password
export async function changePassword(newPassword: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Update password
    const { error: passwordError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (passwordError) {
      return {
        success: false,
        message: passwordError.message || 'Failed to change password',
      };
    }

    return {
      success: true,
      message: 'Password changed successfully',
    };
  } catch (error: unknown) {
    accountLogger.error('Change password error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to change password',
    };
  }
}

// Helper function to delete old profile photo
export async function deleteOldProfilePhoto(oldPhotoUrl: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();

    // Extract file path from URL
    // URL format: https://...supabase.co/storage/v1/object/public/profile-photos/mass-profile/filename
    const urlParts = oldPhotoUrl.split('/profile-photos/');
    if (urlParts.length < 2) {
      return { success: false, message: 'Invalid photo URL format' };
    }

    const filePath = urlParts[1]; // users/user-id/filename

    if (!filePath) {
      return { success: false, message: 'Invalid file path' };
    }

    accountLogger.debug('Deleting old photo:', filePath);

    // Delete file from Supabase Storage
    const { error } = await supabase.storage
      .from('profile-photos')
      .remove([filePath]);

    if (error) {
      accountLogger.error('Delete error:', error);
      return {
        success: false,
        message: `Failed to delete old photo: ${error.message}`,
      };
    }

    accountLogger.debug('Old photo deleted successfully:', filePath);
    return {
      success: true,
      message: 'Old photo deleted successfully',
    };
  } catch (error: unknown) {
    accountLogger.error('Delete old photo error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Upload profile photo using Base64 with improved folder structure
export async function uploadProfilePhotoBase64(uploadData: Base64UploadData): Promise<{
  success: boolean;
  message: string;
  url?: string;
  thumbUrl?: string;
  oldPhotoDeleted?: boolean;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      accountLogger.error('User authentication error:', userError);
      return { success: false, message: "User not authenticated" };
    }

    const { base64Data, fileName, fileType, fileSize, originalBase64Data } = uploadData;

    // Validate input
    if (!base64Data || !fileName || !fileType) {
      return { success: false, message: "Invalid upload data" };
    }

    accountLogger.debug('Processing base64 upload:', {
      fileName,
      fileType,
      fileSize,
      base64Length: base64Data.length,
      hasOriginal: !!originalBase64Data,
      userId: user.id
    });

    // Validate file type
    if (!fileType.startsWith('image/')) {
      return { success: false, message: "Only image files are allowed" };
    }

    // Validate file size (max 8MB)
    if (fileSize > 8 * 1024 * 1024) {
      return { success: false, message: "File size must be less than 8MB" };
    }

    // Get current user profile to check for existing photo
    const { data: currentProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('profile_photo_url')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      accountLogger.error('Profile fetch error:', profileError);
    }

    const origExt = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/gi, '') || 'jpg';
    const timestamp = Date.now();
    const baseFileName = `profile_${user.id}_${timestamp}`;

    try {
      if (typeof Buffer === "undefined") {
        throw new Error("File uploads are not supported in this deployment environment");
      }

      // base64Data = cropped+compressed blob from client → will become thumb
      const croppedBuffer = Buffer.from(base64Data, 'base64');
      accountLogger.debug('Cropped buffer created:', { size: croppedBuffer.length });

      let thumbBuffer: Buffer | null = null;
      let originalUploadBuffer: Buffer | null = null;
      let originalContentType = 'image/webp';
      let originalExt = 'webp';

      // GIF: skip all processing to preserve animation
      if (fileType === 'image/gif') {
        originalContentType = 'image/gif';
        originalExt = 'gif';
        accountLogger.debug('GIF detected, skipping compression');
      } else {
        try {
          const sharp = (await import('sharp')).default;

          // Process the ORIGINAL photo (pre-crop) for mass-profile/original/
          // If client sent original base64, use it. Otherwise fall back to croppedBuffer.
          const sourceBufferForOriginal = originalBase64Data
            ? Buffer.from(originalBase64Data, 'base64')
            : croppedBuffer;

          const originalProcessed = await sharp(sourceBufferForOriginal)
            .rotate()
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 90 })
            .toBuffer();
          originalUploadBuffer = Buffer.from(originalProcessed);

          // Process the CROPPED photo for mass-profile/thumb/ (already cropped on client)
          const thumbProcessed = await sharp(croppedBuffer)
            .rotate()
            .resize(150, 150, { fit: 'cover', position: 'center' })
            .webp({ quality: 85 })
            .toBuffer();
          thumbBuffer = Buffer.from(thumbProcessed);

          accountLogger.debug('Sharp processing done:', {
            original: originalUploadBuffer.length,
            thumb: thumbBuffer.length,
          });
        } catch (e) {
          // Fallback: upload croppedBuffer for both
          originalUploadBuffer = croppedBuffer;
          originalContentType = fileType;
          originalExt = origExt;
          accountLogger.warn('Sharp unavailable, fallback to original:', e instanceof Error ? e.message : e);
        }
      }

      // --- Upload Original (pre-crop full photo) ---
      const originalFileName = `${baseFileName}_original.${originalExt}`;
      const originalPath = `mass-profile/original/${originalFileName}`;

      const { error: origUploadError } = await supabase.storage
        .from('profile-photos')
        .upload(originalPath, originalUploadBuffer ?? croppedBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: originalContentType,
        });

      if (origUploadError) {
        accountLogger.error('Original upload error:', origUploadError);
        return { success: false, message: `Upload failed: ${origUploadError.message}` };
      }

      const { data: { publicUrl: originalPublicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(originalPath);

      // --- Upload Thumbnail (cropped version) ---
      let thumbPublicUrl: string | null = null;
      if (thumbBuffer) {
        const thumbFileName = `${baseFileName}_thumb.webp`;
        const thumbPath = `mass-profile/thumb/${thumbFileName}`;

        const { error: thumbUploadError } = await supabase.storage
          .from('profile-photos')
          .upload(thumbPath, thumbBuffer, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/webp',
          });

        if (thumbUploadError) {
          accountLogger.warn('Thumbnail upload error (non-fatal):', thumbUploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(thumbPath);
          thumbPublicUrl = publicUrl;
        }
      }

      accountLogger.debug('Both versions uploaded:', { originalPublicUrl, thumbPublicUrl });

      // --- Delete old photos (best-effort) ---
      let oldPhotoDeleted = false;
      if (currentProfile?.profile_photo_url) {
        const deleteResult = await deleteOldProfilePhoto(currentProfile.profile_photo_url);
        oldPhotoDeleted = deleteResult.success;
        if (!deleteResult.success) {
          accountLogger.warn('Could not delete old original photo:', deleteResult.message);
        }
      }

      // --- Update database with both URLs ---
      const { error: dbError } = await supabase
        .from('user_profiles')
        .update({
          profile_photo_url: originalPublicUrl,
          ...(thumbPublicUrl ? { profile_photo_thumb_url: thumbPublicUrl } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (dbError) {
        accountLogger.error('DB update error:', dbError);
        await supabase.storage.from('profile-photos').remove([originalPath]);
        return { success: false, message: `DB update failed: ${dbError.message}` };
      }

      revalidatePath('/account');

      return {
        success: true,
        message: 'Profile photo uploaded successfully (2 versions)',
        url: originalPublicUrl,
        thumbUrl: thumbPublicUrl ?? undefined,
        oldPhotoDeleted,
      };
    } catch (bufferError: unknown) {
      accountLogger.error('Buffer processing error:', bufferError);
      return {
        success: false,
        message: `Failed to process image data: ${bufferError instanceof Error ? bufferError.message : 'Unknown error'}`,
      };
    }


  } catch (error: unknown) {
    accountLogger.error('Upload profile photo base64 error:', error);
    return {
      success: false,
      message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Delete user's profile photo and clean up folder if empty
export async function deleteUserProfilePhoto(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Get current user profile
    const { data: currentProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('profile_photo_url')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return {
        success: false,
        message: `Failed to fetch profile: ${profileError.message}`,
      };
    }

    if (!currentProfile?.profile_photo_url) {
      return {
        success: true,
        message: 'No profile photo to delete',
      };
    }

    // Delete the photo file
    const deleteResult = await deleteOldProfilePhoto(currentProfile.profile_photo_url);

    if (!deleteResult.success) {
      return deleteResult;
    }

    // Clear profile_photo_url from database
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        profile_photo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return {
        success: false,
        message: updateError.message || 'Failed to update profile',
      };
    }

    revalidatePath('/account');
    return {
      success: true,
      message: 'Profile photo deleted successfully',
    };
  } catch (error: unknown) {
    accountLogger.error('Delete profile photo error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete profile photo',
    };
  }
}
