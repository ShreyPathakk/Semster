import React, { useEffect } from 'react';
import { AppState, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { supabase } from '../supabaseClient';

export default function RootLayout() {
  const router = useRouter();

  // Age eligibility check function
  const checkEligibility = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('eligible_users')
        .select()
        .eq('id', user.id)
        .single();

      if (error || !data) {
        // User is not eligible (under 18)
        await supabase.auth.signOut();
        Alert.alert(
          "Age Restriction",
          "You must be 18 or older to use this app. You'll be able to access your account when you turn 18."
        );
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
    }
  };

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        // Check eligibility when user signs in
        await checkEligibility();
        router.replace('/(tabs)');
      } else if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/login');
      }
    });

    // Check initial auth state and eligibility
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await checkEligibility();
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    });

    // Set up periodic eligibility checks
    const eligibilityInterval = setInterval(checkEligibility, 1000 * 60 * 60); // Check every hour

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      clearInterval(eligibilityInterval);
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
        
        // Check eligibility when app becomes active
        if (nextAppState === 'active') {
          await checkEligibility();
        }
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