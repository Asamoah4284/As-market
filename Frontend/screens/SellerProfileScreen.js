import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { setProfile, updateProfile } from '../store/slices/userSlice';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { profile, isLoading } = useSelector(state => state.user);
  const { userToken } = useSelector(state => state.auth);

  const fetchSellerData = async () => {
    try {
      const response = await fetch('https://unimarket-ikin.onrender.com/api/seller/profile', {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch seller data');
      }

      const data = await response.json();
      dispatch(setProfile(data));
    } catch (error) {
      console.error('Error fetching seller data:', error);
    }
  };

  useEffect(() => {
    fetchSellerData();
  }, []);

  // Mock data for recent activities
  const activities = [
    { id: 1, type: 'post', title: 'Completed my first marathon!', date: '2 days ago' },
    { id: 2, type: 'achievement', title: 'Earned "Early Bird" badge', date: '1 week ago' },
    { id: 3, type: 'post', title: 'Visited Grand Canyon', date: '2 weeks ago' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => {}}>
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: profile?.avatar }} style={styles.avatar} />
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={18} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.name}>{profile?.name}</Text>
          <Text style={styles.username}>{profile?.username}</Text>
          <Text style={styles.bio}>{profile?.bio}</Text>
          
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?.posts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {activities.map(activity => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                <Ionicons 
                  name={activity.type === 'post' ? 'document-text' : 'trophy'} 
                  size={20} 
                  color="#4A80F0" 
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDate}>{activity.date}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          ))}
        </View>

        {/* Settings Options */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={22} color="#555" />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.settingArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="lock-closed-outline" size={22} color="#555" />
            <Text style={styles.settingText}>Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.settingArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="help-circle-outline" size={22} color="#555" />
            <Text style={styles.settingText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.settingArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.settingItem, styles.logoutItem]}>
            <Ionicons name="log-out-outline" size={22} color="#FF5757" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 25,
    backgroundColor: 'white',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4A80F0',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4A80F0',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 15,
  },
  editProfileButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4A80F0',
  },
  editProfileText: {
    color: '#4A80F0',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: 'white',
    marginTop: 10,
    borderRadius: 12,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#eee',
  },
  sectionContainer: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF3FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  activityDate: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    flex: 1,
  },
  settingArrow: {
    marginLeft: 'auto',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF5757',
    marginLeft: 15,
  },
});

export default ProfileScreen;
