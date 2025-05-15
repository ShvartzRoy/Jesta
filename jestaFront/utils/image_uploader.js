// ImageUploader.js
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabaseClient';

export async function uploadProfileImage(userId, authToken) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: true,
  });

  if (!result.canceled) {
    const image = result.assets[0];

    const ext = image.uri.split('.').pop();
    const fileName = `user-${userId}.${ext}`;
    const contentType = getMimeType(image.uri) || 'image/jpeg';

    const file = {
      uri: image.uri,
      name: fileName,
      type: contentType,
    };

    // Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from('profile.img') // your bucket name
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName);

    const publicUrl = data.publicUrl;

    // Send the public URL to your Django backend
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
