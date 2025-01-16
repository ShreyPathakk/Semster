import { Stack } from 'expo-router';

export default function RequestsLayout() {
  return (
    <Stack screenOptions={{
      presentation: 'modal',
      animation: 'slide_from_bottom',
    }}>
      <Stack.Screen 
        name="index"
        options={{
          title: 'Notifications',
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}