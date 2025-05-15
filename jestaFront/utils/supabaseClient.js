// utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto'; // required for React Native

export const supabase = createClient(
  'https://mfcoewmpgxaocqsxiguk.supabase.co/storage/v1/s3',
  '67de8eb193ff0358b6dd44f13f83f1a022c55bccd47289f264640cd9230dd5a6'
);
