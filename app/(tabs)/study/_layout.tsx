import { Stack } from 'expo-router';

export default function StudyLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Study Hub',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="my-classes"
        options={{
          title: 'My Classes',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="create-groups"
        options={{
          title: 'Create Study Group',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="find-peers"
        options={{
          title: 'Find Study Buddies',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="my-groups"
        options={{
          title: 'My Study Groups',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
