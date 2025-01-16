// app/(tabs)/index.tsx
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../supabaseClient';

// Define color scheme
const COLORS = {
  primary: '#00838F',     // Elegant teal
  secondary: '#4A6670',   // Deep slate blue
  accent: '#B4A5A5',      // Muted mauve
  success: '#2E7D72',     // Deep teal green
  warning: '#8D6E63',     // Warm brown
  background: '#FFFFFF',  
  surface: '#F5F7F8',    // Light gray-blue
  text: {
    primary: '#2C3A41',   // Dark slate
    secondary: '#5C6B73', // Medium gray
    light: '#8E9BA1'      // Light gray
  },
  border: '#E1E8EB'       // Light border color
};

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [activeGroups, setActiveGroups] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalGroups: 0,
    totalBuddies: 0,
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadPendingRequests, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPendingRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get friend requests
      const { data: friendRequests, error: friendError } = await supabase
        .from('friendship_requests')
        .select('id', { count: 'exact' })
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      // Get group requests
      const { data: groupRequests, error: groupError } = await supabase
        .from('group_join_requests')
        .select('id', { count: 'exact' })
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (friendError || groupError) throw friendError || groupError;
      
      const totalRequests = (friendRequests?.length || 0) + (groupRequests?.length || 0);
      setPendingRequests(totalRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      // Load pending requests
      await loadPendingRequests();

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setUserData(profile || { name: 'User' });

      // Fetch today's classes
      const { data: classes, error: classesError } = await supabase
        .from('semester_schedules')
        .select('*')
        .eq('user_id', user.id);

      if (classesError) throw classesError;
      setTodayClasses(classes || []);

      // Fetch active study groups
      const { data: groups, error: groupsError } = await supabase
        .from('group_members')
        .select(`
          study_groups (
            id,
            name,
            semester_schedules!class_id (
              class_name,
              professor_name
            )
          )
        `)
        .eq('user_id', user.id)
        .limit(3);

      if (groupsError) throw groupsError;
      setActiveGroups(groups || []);

      // Get friend count
      const { count: buddyCount, error: buddyError } = await supabase
        .from('friendships')
        .select('*', { count: 'exact' })
        .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`);

      if (buddyError) throw buddyError;

      // Update stats
      setStats({
        totalClasses: classes?.length || 0,
        totalGroups: groups?.length || 0,
        totalBuddies: buddyCount || 0
      });

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTextMain}>Socia</Text>
          <View style={styles.brandDot} />
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/requests')}
          >
            <Ionicons name="notifications-outline" size={28} color={COLORS.text.primary} />
            {pendingRequests > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequests}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-circle-outline" size={28} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{userData?.display_name || 'User'} 👋</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={[styles.statItem, styles.statItemBorder]}>
            <View style={[styles.statIconContainer, { backgroundColor: `${COLORS.primary}15` }]}>
              <Ionicons name="book" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statNumber}>{stats.totalClasses}</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>
          <View style={[styles.statItem, styles.statItemBorder]}>
            <View style={[styles.statIconContainer, { backgroundColor: `${COLORS.success}15` }]}>
              <Ionicons name="people" size={24} color={COLORS.success} />
            </View>
            <Text style={[styles.statNumber, { color: COLORS.success }]}>{stats.totalGroups}</Text>
            <Text style={styles.statLabel}>Groups</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: `${COLORS.secondary}15` }]}>
              <Ionicons name="person" size={24} color={COLORS.secondary} />
            </View>
            <Text style={[styles.statNumber, { color: COLORS.secondary }]}>{stats.totalBuddies}</Text>
            <Text style={styles.statLabel}>Buddies</Text>
          </View>
        </View>

        {/* Today's Classes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="today" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Today's Classes</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classesScroll}>
            {todayClasses.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons 
                  name="calendar-outline" 
                  size={32} 
                  color={COLORS.text.light}
                  style={styles.emptyIcon} 
                />
                <Text style={styles.emptyText}>No classes scheduled for today</Text>
              </View>
            ) : (
              todayClasses.map((cls) => (
                <View key={cls.id} style={styles.classCard}>
                  <View style={[styles.classIconContainer, { backgroundColor: `${COLORS.primary}15` }]}>
                    <Ionicons name="school" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.className}>{cls.class_name}</Text>
                  <Text style={styles.classInfo}>Prof. {cls.professor_name}</Text>
                  <Text style={styles.classInfo}>Section {cls.section}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Active Study Groups */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="people" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Active Study Groups</Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/study/my-groups')}
            >
              <Text style={[styles.seeAllText, { color: COLORS.primary }]}>See All</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          {activeGroups.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons 
                name="people-outline" 
                size={32} 
                color={COLORS.text.light}
                style={styles.emptyIcon} 
              />
              <Text style={styles.emptyText}>No active study groups</Text>
              <TouchableOpacity 
                style={styles.createGroupButton}
                onPress={() => router.push('/study/create-groups')}
              >
                <Ionicons name="add" size={20} color={COLORS.background} />
                <Text style={styles.createGroupButtonText}>Create a Group</Text>
              </TouchableOpacity>
            </View>
          ) : (
            activeGroups.map((group) => (
              <TouchableOpacity 
                key={group.study_groups.id} 
                style={styles.groupCard}
                onPress={() => router.push('/study/my-groups')}
              >
                <View style={styles.groupContent}>
                  <View style={[styles.groupIconContainer, { backgroundColor: `${COLORS.success}15` }]}>
                    <Ionicons name="people" size={24} color={COLORS.success} />
                  </View>
                  <View style={styles.groupTextContainer}>
                    <Text style={styles.groupName}>{group.study_groups.name}</Text>
                    <Text style={styles.groupInfo}>
                      {group.study_groups.semester_schedules.class_name}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.text.light} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="flash" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/study/find-peers')}
            >
              <View style={[styles.actionIconBg, { backgroundColor: `${COLORS.primary}15` }]}>
                <Ionicons name="people" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.quickActionText}>Find Study Buddies</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/study/create-groups')}
            >
              <View style={[styles.actionIconBg, { backgroundColor: `${COLORS.success}15` }]}>
                <Ionicons name="add-circle" size={24} color={COLORS.success} />
              </View>
              <Text style={styles.quickActionText}>Create Group</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/study/my-classes')}
            >
              <View style={[styles.actionIconBg, { backgroundColor: `${COLORS.secondary}15` }]}>
                <Ionicons name="book" size={24} color={COLORS.secondary} />
              </View>
              <Text style={styles.quickActionText}>My Classes</Text>
            </TouchableOpacity>
          </View>
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
  brandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTextMain: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 1,
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginLeft: 4,
    marginTop: -20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    position: 'relative',
    padding: 5,
    marginLeft: 15,
  },
  badge: {
    position: 'absolute',
    right: -2,
    top: -2,
    backgroundColor: COLORS.warning,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  badgeText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.background,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 16,
    shadowColor: COLORS.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statItemBorder: {
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingRight: 15,
    marginRight: 15,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  classesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  classCard: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    width: 200,
    shadowColor: COLORS.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  classIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  classInfo: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  groupCard: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: COLORS.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupTextContainer: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  groupInfo: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  quickActionButton: {
    alignItems: 'center',
    width: '31%',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 16,
    shadowColor: COLORS.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 13,
    color: COLORS.text.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
  },
  createGroupButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});