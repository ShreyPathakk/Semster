import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { supabase } from '../supabaseClient';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.replace('/(tabs)'); // Redirect to tabs after login
      } else if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/login'); // Redirect to login when signed out
      }
    });

    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    });

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [router]);

  useEffect(() => {
    let presenceChannel;

    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            is_online: true,
            last_seen: new Date().toISOString(),
          });

        // Setup presence channel
        presenceChannel = supabase.channel('online-users')
          .on('presence', { event: 'sync' }, () => {
            // Handle presence sync
          })
          .subscribe();
      }
    };

    setupPresence();

    const appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            is_online: nextAppState === 'active',
            last_seen: new Date().toISOString(),
          });
      }
    });

    return () => {
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
      appStateSubscription.remove();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="requests" 
        options={{ 
          headerShown: true,
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }} 
      />
      <Stack.Screen 
        name="profile-setup" 
        options={{ 
          headerShown: false,
          gestureEnabled: false 
        }} 
      />
      <Stack.Screen name="(user)" options={{ headerShown: false }} />
    </Stack>
  );
}