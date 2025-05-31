import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Patch: RealtimeClient will be undefined, so no WS crash
const supabase = createClient(
  'https://mfcoewmpgxaocqsxiguk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mY29ld21wZ3hhb2Nxc3hpZ3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5Mjc1MTgsImV4cCI6MjA1OTUwMzUxOH0.gA590HdBZYqt4sUrXc6HyqQ4mp9INuwOi75oTllpNpc',
  {
    global: {
      fetch: fetch, // Ensures compatibility with React Native
    },
    realtime: {
      // 👇 disables websocket initialization
      enabled: false,
    },
  }
);

export { supabase };
