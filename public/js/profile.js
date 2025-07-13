import { supabaseClientPromise } from './supabase-client.js';

// Function to handle profile form submission
export async function handleProfileSubmission(profileData) {
  try {
    // Store profile data in localStorage for later use after OTP verification
    const completeProfile = {
      full_name: `${profileData.firstName} ${profileData.lastName}`,
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      birthday: profileData.birthday,
      location: profileData.location,
      phone_number: profileData.phoneNumber,
      created_at: new Date().toISOString()
    };
    
    localStorage.setItem('userProfile', JSON.stringify(completeProfile));
    
    // Use the existing auth.js function to send OTP
    const { signInWithPhone } = await import('./auth.js');
    await signInWithPhone(profileData.phoneNumber);
    
    return { 
      success: true, 
      message: 'Verification code sent to your phone. Please verify to complete signup.'
    };
  } catch (error) {
    console.error('Error in handleProfileSubmission:', error);
    return { success: false, error };
  }
}

// Function to verify OTP and complete profile creation
export async function verifyOtpAndCompleteProfile(phone, otp) {
  try {
    // Use the existing auth.js functions
    const { verifyPhoneOtp, saveCompleteProfileToSupabase } = await import('./auth.js');
    
    // Verify the OTP using the auth.js function
    await verifyPhoneOtp(phone, otp);
    
    // Save the profile using the auth.js function
    const result = await saveCompleteProfileToSupabase();
    
    if (!result.success) {
      console.error('Error saving profile:', result.error);
      return { success: false, error: result.error };
    }
    
    console.log('Profile successfully saved to Supabase');
    return { success: true };
  } catch (error) {
    console.error('Error in verifyOtpAndCompleteProfile:', error);
    return { success: false, error };
  }
}

// Function to upload profile photo
export async function uploadProfilePhoto(file, userId) {
  try {
    const supabase = await supabaseClientPromise;
    
    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/profile.${fileExt}`;
    
    // Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, {
        upsert: true
      });
    
    if (uploadError) {
      console.error('Error uploading profile photo:', uploadError);
      return { success: false, error: uploadError };
    }
    
    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);
    
    // Update the user's profile with the photo URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error updating profile with photo URL:', updateError);
      return { success: false, error: updateError };
    }
    
    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error('Error in uploadProfilePhoto:', error);
    return { success: false, error };
  }
}
