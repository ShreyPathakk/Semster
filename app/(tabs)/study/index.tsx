// app/(tabs)/study.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Define base colors first
const BASE_COLORS = {
  teal: '#00838F',
  slate: '#4A6670',
  mauve: '#B4A5A5',
  forest: '#2E7D32',
  brown: '#8D6E63',
  white: '#FFFFFF',
  grayBlue: '#F5F7F8',
  darkSlate: '#2C3A41',
  mediumGray: '#5C6B73',
  lightGray: '#8E9BA1',
  borderGray: '#E1E8EB',
  orange: '#E65100',
  blue: '#1565C0'
};

// Then build the color scheme
const COLORS = {
  primary: BASE_COLORS.teal,
  secondary: BASE_COLORS.slate,
  accent: BASE_COLORS.mauve,
  success: BASE_COLORS.forest,
  warning: BASE_COLORS.brown,
  background: BASE_COLORS.white,
  surface: BASE_COLORS.grayBlue,
  text: {
    primary: BASE_COLORS.darkSlate,
    secondary: BASE_COLORS.mediumGray,
    light: BASE_COLORS.lightGray
  },
  border: BASE_COLORS.borderGray,
  cards: {
    classes: {
      bg: '#E3F6F7',
      icon: BASE_COLORS.teal
    },
    buddies: {
      bg: '#E8F5E9',
      icon: BASE_COLORS.forest
    },
    create: {
      bg: '#FFF3E0',
      icon: BASE_COLORS.orange
    },
    groups: {
      bg: '#E3F2FD',
      icon: BASE_COLORS.blue
    }
  }
};

const STUDY_OPTIONS = [
  {
    id: 'classes',
    title: 'My Classes',
    description: 'View and manage your class schedule',
    icon: 'book',
    route: '/study/my-classes',
    colors: COLORS.cards.classes
  },
  {
    id: 'buddies',
    title: 'Find Study Buddies',
    description: 'Connect with classmates and form study partnerships',
    icon: 'people',
    route: '/study/find-peers',
    colors: COLORS.cards.buddies
  },
  {
    id: 'create',
    title: 'Create Study Group',
    description: 'Form a study group with friends and classmates',
    icon: 'add-circle',
    route: '/study/create-groups',
    colors: COLORS.cards.create
  },
  {
    id: 'groups',
    title: 'My Groups',
    description: 'View and manage your study groups',
    icon: 'bookmark',
    route: '/study/my-groups',
    colors: COLORS.cards.groups
  }
];

export default function StudyScreen() {
  const renderCard = ({ id, title, description, icon, route, colors }) => (
    <TouchableOpacity
      key={id}
      style={styles.card}
      onPress={() => router.push(route)}
    >
      <View style={[styles.cardContent, { backgroundColor: colors.bg }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.icon}15` }]}>
            <Ionicons name={icon} size={32} color={colors.icon} />
          </View>
          <View style={styles.cardHeaderTexts}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
        </View>
        <View style={styles.cardAction}>
          <Ionicons 
            name="arrow-forward-circle" 
            size={24} 
            color={colors.icon}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandText}>Study Hub</Text>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle-outline" size={28} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Ready to study?</Text>
          <Text style={styles.subText}>Choose from the options below to get started</Text>
        </View>

        {/* Cards Grid */}
        <View style={styles.grid}>
          {STUDY_OPTIONS.map(renderCard)}
        </View>

        {/* Motivational Quote */}
        <View style={styles.quoteContainer}>
          <View style={styles.quoteIconContainer}>
            <Ionicons name="quote" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.quoteText}>
            "Education is not preparation for life; education is life itself."
          </Text>
          <Text style={styles.quoteAuthor}>- John Dewey</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  profileButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  grid: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    shadowColor: COLORS.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardHeaderTexts: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  cardAction: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteContainer: {
    marginTop: 24,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
  },
  quoteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 18,
    color: COLORS.text.primary,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 26,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
});