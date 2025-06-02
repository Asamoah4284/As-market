import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Token used for fetching users:', token);
      
      const response = await fetch('https://unimarket-ikin.onrender.com/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server response:', response.status, errorData);
        throw new Error(`Failed to fetch users: ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch users');
      setLoading(false);
      console.error('Error fetching users:', err);
    }
  };

  const deleteUser = async (userId) => {
    // Show confirmation dialog
    Alert.alert(
      "Delete User",
      "Are you sure you want to delete this user?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('userToken');
              console.log('Token used for deleting user:', token);
              
              const response = await fetch(`https://ket-ikin.onrender.com/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
              });
              
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Server response:', response.status, errorData);
                throw new Error(`Failed to delete user: ${errorData.message || response.statusText}`);
              }
              
              // Update UI after successful deletion
              setUsers(users.filter(user => user.id !== userId));
              setLoading(false);
            } catch (err) {
              setError('Failed to delete user');
              setLoading(false);
              console.error('Error deleting user:', err);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userDetail}>ID: {item.id}</Text>
        <Text style={styles.userDetail}>Phone: {item.phone}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <View style={styles.actionContainer}>
        <View style={[styles.roleBadge, 
          item.role === 'Admin' ? styles.adminBadge : 
          item.role === 'Manager' ? styles.managerBadge : styles.userBadge
        ]}>
          <Text style={styles.roleText}>{item.role || 'User'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => deleteUser(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  console.log('UserManagement rendering, users:', users.length, 'loading:', loading);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{marginTop: 10}}>Loading users...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>User Management</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {users.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.placeholderText}>No users found</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id ? item.id.toString() : String(Math.random())}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    width: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  addButton: {
    backgroundColor: '#4299e1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4299e1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  listContainer: {
    paddingBottom: 16,
    flexGrow: 1,
  },
  userCard: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 6,
  },
  userDetail: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#718096',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  adminBadge: {
    backgroundColor: 'rgba(245, 101, 101, 0.15)',
  },
  managerBadge: {
    backgroundColor: 'rgba(66, 153, 225, 0.15)',
  },
  userBadge: {
    backgroundColor: 'rgba(72, 187, 120, 0.15)',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3748',
  },
  actionButton: {
    backgroundColor: '#f56565',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#f56565',
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default UserManagement;
