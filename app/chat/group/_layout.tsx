import { Stack } from 'expo-router';

export default function GroupChatLayout() {
  return (
    <Stack screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#fff',
      },
      headerTintColor: '#007AFF',
      headerTitleStyle: {
        fontWeight: '600',
      },
      headerShadowVisible: false,
    }}>
      <Stack.Screen 
        name="[id]" 
        options={{
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="info/[id]"
        options={{
          title: 'Group Info',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="schedule"
        options={{
          title: 'Schedule Meeting',
          presentation: 'modal',
          headerLeft: () => null,
          gestureEnabled: true,
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}