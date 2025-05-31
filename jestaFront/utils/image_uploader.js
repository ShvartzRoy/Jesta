import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabaseClient';

export async function uploadProfileImage(userId, authToken) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: true,
    base64: true, // <== needed for base64 upload
  });

  if (!result.canceled) {
    const image = result.assets[0];

    const ext = image.uri.split('.').pop();
    const contentType = getMimeType(image.uri) || 'image/jpeg';
    const fileName = `${userId}/user-${userId}.jpg`;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(image.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Optional: authenticate
    await supabase.auth.setSession({
      access_token: authToken,
      refresh_token: '',
    });

    // Upload
    const { error } = await supabase.storage
      .from('profile.img')
      .upload(fileName, decode(base64), {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      return;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('profile.img')
      .getPublicUrl(fileName);
    const publicUrl = data.publicUrl;
    // Update Django backend
    const response = await fetch(`${process.env.EXPO_PUBLIC_HOST}/api/users/update_profile_image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_url: publicUrl }),
    });

    const resultJson = await response.json();
    console.log('Image saved to backend:', resultJson);
    return publicUrl;
  }
}

function getMimeType(uri) {
  const extension = uri.split('.').pop().toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}
