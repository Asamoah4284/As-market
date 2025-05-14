import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, LogBox, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import UserManagement from './UserManagement';
import AllProducts from './AllProducts';
import PendingProducts from './PendingProducts';
import NewArrivals from './NewArrivals';
import FeaturedProducts from './FeaturedProducts';
import FeaturedServices from './FeaturedServices';
import TrendingProducts from './TrendingProducts';
import SpecialOffers from './SpecialOffers';
import PremiumProducts from './PremiumProducts';
import AllOrders from './AllOrders';
import PendingOrders from './PendingOrders';
import CompletedOrders from './CompletedOrders';
import { useSelector } from 'react-redux';
import NotificationCenter from '../components/NotificationCenter';
import NotificationBadge from '../components/NotificationBadge';
import { registerForPushNotificationsAsync } from '../services/notificationService';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
// Ignore specific SVG-related warnings
LogBox.ignoreLogs([
  'Invariant Violation: Tried to register two views with the same name RNSVGFeFlood',
  'Invariant Violation: Tried to register two views with the same name RNSVGFeGaussianBlur',
  'Invariant Violation: Tried to register two views with the same name RNSVGFeMerge',
  'Invariant Violation: Tried to register two views with the same name RNSVGFeOffset',
]);

const Admin = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(route.params?.section || 'dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalOrders: 0,
    revenue: 0,
  });
  const [trends, setTrends] = useState({
    userGrowth: [],
    orderTrends: [],
    revenueTrends: [],
    activeUserRate: 0
  });
  const slideAnim = useRef(new Animated.Value(-250)).current; // Initialize off-screen
  const [showProductDropdowns, setShowProductDropdowns] = useState(false);
  const [showOrderDropdowns, setShowOrderDropdowns] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications } = useSelector((state) => state.notifications);
  
  // Count unread admin-related notifications
  const unreadAdminNotifications = notifications.filter(
    notification => !notification.read && 
    notification.data?.type === 'ADMIN_PAYMENT_RECEIVED'
  ).length;

  useEffect(() => {
    // Update active section when route params change
    if (route.params?.section) {
      setActiveSection(route.params.section);
    }
  }, [route.params]);

  useEffect(() => {
    // Fetch admin dashboard data
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const registerAdminPushToken = async () => {
      try {
        console.log('Registering admin push token...');
        const token = await registerForPushNotificationsAsync();
        
        if (token) {
          console.log('Registering admin token with backend:', token.substring(0, 10) + '...');
          
          // Use the admin token endpoint that doesn't require auth
          const response = await axios.post(
            `${API_BASE_URL}/api/notifications/admin-token`,
            {
              pushToken: token,
              adminKey: 'asarion_admin_key'
            }
          );
          
          console.log('Admin token registration response:', response.data);
        } else {
          console.error('Failed to get push token for admin');
        }
      } catch (error) {
        console.error('Error registering admin push token:', error.message);
      }
    };
    
    registerAdminPushToken();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      // const response = await fetch('your-api-endpoint/admin/dashboard');
      // const data = await response.json();
      // setStats(data);
      // setTrends(data.trends);
      
      // Simulating API response with dummy data
      setTimeout(() => {
        setStats({
          totalUsers: 1250,
          activeUsers: 876,
          totalOrders: 3421,
          revenue: 28750,
        });
        
        // Simulated trend data
        setTrends({
          userGrowth: [820, 932, 1041, 1138, 1250],
          orderTrends: [2100, 2340, 2800, 3100, 3421],
          revenueTrends: [15200, 18400, 22300, 25800, 28750],
          activeUserRate: 70.1
        });
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const adminOptions = [
    {
      title: 'Dashboard',
      icon: 'dashboard',
      section: 'dashboard',
      description: 'Overview of your business'
    },
    {
      title: 'User Management',
      icon: 'people',
      section: 'users',
      description: 'View and manage user accounts'
    },
    {
      title: 'Order Management',
      icon: 'shopping-cart',
      section: 'orders',
      description: 'Track and process orders',
      subItems: [
        { title: 'All Orders', params: { filter: 'All Orders' } },
        { title: 'Pending Orders', params: { filter: 'Pending Orders' } },
        { title: 'Completed Orders', params: { filter: 'Completed Orders' } }
      ]
    },
    {
      title: 'Product Management',
      icon: 'inventory',
      section: 'products',
      description: 'Add, edit, and remove products',
      subItems: [
        { title: 'All Products', params: { filter: 'All Products', fetchAll: true } },
        { title: 'Pending Products', params: { filter: 'Pending Products' } },
        { title: 'New Arrivals',  params: { filter: 'New Arrivals' } },
        { title: 'Featured Products',  params: { filter: 'Featured Products' } },
        { title: 'Featured Services',  params: { filter: 'Featured Services' } },
        { title: 'Trending',  params: { filter: 'Trending' } },
        { title: 'Special Offers',  params: { filter: 'Special Offers' } },
        { title: 'Premium',  params: { filter: 'Premium' } }
      ]
    },
    {
      title: 'Settings',
      icon: 'settings',
      section: 'settings',
      description: 'Configure application settings'
    },
  ];

  const toggleDrawer = () => {
    const toValue = drawerOpen ? -250 : 0;
    
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      speed: 12,
      bounciness: 8,
    }).start();
    
    setDrawerOpen(!drawerOpen);
  };

  const closeDrawer = () => {
    Animated.spring(slideAnim, {
      toValue: -250,
      useNativeDriver: true,
      speed: 12,
      bounciness: 8,
    }).start();
    
    setDrawerOpen(false);
  };

  const navigateToSection = (section, screen, params) => {
    setActiveSection(section);
    if (screen) {
      navigation.navigate(screen, params);
    } else if (params) {
      navigation.setParams(params);
    }
    closeDrawer();
  };

  const renderDrawerContent = () => (
    <ScrollView style={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerHeaderTitle}>Admin Menu</Text>
      </View>
      {adminOptions.map((option, index) => (
        <View key={index}>
          <TouchableOpacity 
            style={[
              styles.drawerItem, 
              activeSection === option.section && styles.activeDrawerItem
            ]}
            onPress={() => {
              if (option.subItems) {
                // Toggle dropdown for items with subitems
                if (option.section === 'orders') {
                  setShowOrderDropdowns(!showOrderDropdowns);
                } else if (option.section === 'products') {
                  setShowProductDropdowns(!showProductDropdowns);
                } else {
                  navigateToSection(option.section);
                }
              } else {
                navigateToSection(option.section);
              }
            }}
          >
            <MaterialIcons name={option.icon} size={24} color={activeSection === option.section ? "#ffffff" : "#0066cc"} />
            <Text style={[
              styles.drawerItemText,
              activeSection === option.section && styles.activeDrawerItemText
            ]}>{option.title}</Text>
            {option.subItems && (
              <MaterialIcons 
                name={(option.section === 'orders' && showOrderDropdowns) || (option.section === 'products' && showProductDropdowns) ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={20} 
                color={activeSection === option.section ? "#ffffff" : "#0066cc"} 
                style={{marginLeft: 'auto'}}
              />
            )}
          </TouchableOpacity>
          
          {/* Show sub-items if this option has them and the dropdown is open */}
          {option.subItems && ((option.section === 'orders' && showOrderDropdowns) || (option.section === 'products' && showProductDropdowns)) && (
            <View style={styles.subItemsContainer}>
              {option.subItems.map((subItem, subIndex) => (
                <TouchableOpacity
                  key={subIndex}
                  style={styles.subItem}
                  onPress={() => {
                    navigateToSection(option.section, subItem.screen, subItem.params);
                  }}
                >
                  <Text style={styles.subItemText}>{subItem.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderContent = () => {
    switch(activeSection) {
      case 'dashboard':
        return (
          <ScrollView>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome, Admin!</Text>
              <Text style={styles.welcomeSubtext}>Here's an overview of your business</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
            ) : (
              <>
                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                      <MaterialIcons name="people" size={20} color="#0066cc" />
                      <Text style={styles.statLabel}>Total Users</Text>
                    </View>
                    <Text style={styles.statValue}>{stats.totalUsers}</Text>
                    <View style={styles.trendIndicator}>
                      <MaterialIcons name="trending-up" size={16} color="#4CAF50" />
                      <Text style={styles.trendPositive}>+12% this month</Text>
                    </View>
                  </View>
                  
                  <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                      <MaterialIcons name="person" size={20} color="#0066cc" />
                      <Text style={styles.statLabel}>Active Users</Text>
                    </View>
                    <Text style={styles.statValue}>{stats.activeUsers}</Text>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, {width: `${trends.activeUserRate}%`}]} />
                    </View>
                    <Text style={styles.progressText}>{trends.activeUserRate}% of total users</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                      <MaterialIcons name="shopping-cart" size={20} color="#0066cc" />
                      <Text style={styles.statLabel}>Orders</Text>
                    </View>
                    <Text style={styles.statValue}>{stats.totalOrders}</Text>
                    <View style={styles.trendIndicator}>
                      <MaterialIcons name="trending-up" size={16} color="#4CAF50" />
                      <Text style={styles.trendPositive}>+8% this month</Text>
                    </View>
                  </View>
                  
                  <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                      <MaterialIcons name="attach-money" size={20} color="#0066cc" />
                      <Text style={styles.statLabel}>Revenue</Text>
                    </View>
                    <Text style={styles.statValue}>${stats.revenue}</Text>
                    <View style={styles.trendIndicator}>
                      <MaterialIcons name="trending-up" size={16} color="#4CAF50" />
                      <Text style={styles.trendPositive}>+15% this month</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>User Growth</Text>
                  <LineChart
                    data={{
                      labels: ["Jan", "Feb", "Mar", "Apr", "May"],
                      datasets: [{ data: trends.userGrowth }]
                    }}
                    width={Dimensions.get("window").width - 40}
                    height={220}
                    chartConfig={{
                      backgroundColor: "#ffffff",
                      backgroundGradientFrom: "#ffffff",
                      backgroundGradientTo: "#ffffff",
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(0, 102, 204, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      style: { borderRadius: 16 },
                      propsForDots: { r: "6", strokeWidth: "2", stroke: "#0066cc" }
                    }}
                    bezier
                    style={styles.chart}
                  />
                </View>

                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Revenue Trends</Text>
                  <BarChart
                    data={{
                      labels: ["Jan", "Feb", "Mar", "Apr", "May"],
                      datasets: [{ data: trends.revenueTrends.map(val => val/1000) }]
                    }}
                    width={Dimensions.get("window").width - 40}
                    height={220}
                    yAxisSuffix="k"
                    chartConfig={{
                      backgroundColor: "#ffffff",
                      backgroundGradientFrom: "#ffffff",
                      backgroundGradientTo: "#ffffff",
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      style: { borderRadius: 16 },
                      barPercentage: 0.7,
                    }}
                    style={styles.chart}
                  />
                </View>

                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryTitle}>Monthly Summary</Text>
                  <View style={styles.summaryItem}>
                    <MaterialIcons name="arrow-upward" size={20} color="#4CAF50" />
                    <Text style={styles.summaryText}>User growth is trending upward at 12% this month</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <MaterialIcons name="arrow-upward" size={20} color="#4CAF50" />
                    <Text style={styles.summaryText}>Revenue has increased by 15% compared to last month</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <MaterialIcons name="info" size={20} color="#FF9800" />
                    <Text style={styles.summaryText}>70% of registered users are active this month</Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        );
      case 'users':
        return (
          <View style={[styles.sectionContainer, {flex: 1, padding: 0}]}>
            <UserManagement />
          </View>
        );
      case 'products':
        // New switch statement for product management screens
        switch(route.params?.filter) {
          case 'All Products':
          case 'Pending Products':
          case 'New Arrivals':
          case 'Featured Products':
          case 'Featured Services':
          case 'Trending':
          case 'Special Offers':
          case 'Premium':
            return (
              <View style={[styles.sectionContainer, {flex: 1, padding: 0}]}>
                <Text style={styles.sectionTitle}>{route.params?.filter}</Text>
                <View style={styles.componentContainer}>
                  {/* Replace with actual components based on filter */}
                  {route.params?.filter === 'All Products' && <AllProducts />}
                  {route.params?.filter === 'Pending Products' && <PendingProducts />}
                  {route.params?.filter === 'New Arrivals' && <NewArrivals />}
                  {route.params?.filter === 'Featured Products' && <FeaturedProducts />}
                  {route.params?.filter === 'Featured Services' && <FeaturedServices />}
                  {route.params?.filter === 'Trending' && <TrendingProducts />}
                  {route.params?.filter === 'Special Offers' && <SpecialOffers />}
                  {route.params?.filter === 'Premium' && <PremiumProducts />}
                </View>
              </View>
            );
          default:
            // Default product management view when no specific filter is selected
            return (
              <ScrollView>
                <View>
                  <TouchableOpacity 
                    style={styles.sectionHeader}
                    onPress={() => setShowProductDropdowns(!showProductDropdowns)}
                  >
                    <Text style={styles.sectionTitle}>Product Management</Text>
                    <MaterialIcons 
                      name={showProductDropdowns ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                      size={24} 
                      color="#333" 
                    />
                  </TouchableOpacity>
                  
                  {showProductDropdowns && (
                    <View style={styles.productCategoriesContainer}>
                      {adminOptions.find(option => option.section === 'products').subItems.map((item, index) => (
                        <TouchableOpacity 
                          key={index}
                          style={styles.categoryDropdown} 
                          onPress={() => {
                            navigation.setParams({ section: 'products', filter: item.params.filter });
                          }}
                        >
                          <Text style={styles.categoryText}>{item.title}</Text>
                          <MaterialIcons name="keyboard-arrow-right" size={24} color="#0066cc" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  
                  <View style={styles.productStatsContainer}>
                    <View style={styles.productStatCard}>
                      <Text style={styles.productStatValue}>124</Text>
                      <Text style={styles.productStatLabel}>Total Products</Text>
                    </View>
                    <View style={styles.productStatCard}>
                      <Text style={styles.productStatValue}>18</Text>
                      <Text style={styles.productStatLabel}>Out of Stock</Text>
                    </View>
                    <View style={styles.productStatCard}>
                      <Text style={styles.productStatValue}>32</Text>
                      <Text style={styles.productStatLabel}>New Items</Text>
                    </View>
                  </View>
                  
                  {!showProductDropdowns && (
                    <Text style={styles.placeholderText}>Tap on Product Management to view categories</Text>
                  )}
                </View>
              </ScrollView>
            );
        }
      case 'orders':
        return (
          <View style={[styles.sectionContainer, {flex: 1, padding: 0}]}>
            <Text style={styles.sectionTitle}>Order Management</Text>
            <View style={styles.componentContainer}>
              {route.params?.filter === 'All Orders' && <AllOrders />}
              {route.params?.filter === 'Pending Orders' && <PendingOrders />}
              {route.params?.filter === 'Completed Orders' && <CompletedOrders />}
            </View>
          </View>
        );
      case 'settings':
        return (
          <ScrollView>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <Text style={styles.placeholderText}>Settings content will be displayed here.</Text>
            </View>
          </ScrollView>
        );
      default:
        return null;
    }   
  };

  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
          <MaterialIcons 
            name={drawerOpen ? "close" : "menu"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {adminOptions.find(option => option.section === activeSection)?.title || 'Admin Dashboard'}
        </Text>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => setShowNotifications(true)}
        >
          <MaterialIcons name="notifications" size={24} color="white" />
          {unreadAdminNotifications > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadAdminNotifications}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.overlay, { display: drawerOpen ? 'flex' : 'none' }]}
        onPress={closeDrawer}
        activeOpacity={1}
      />
      
      <View style={styles.contentContainer}>
        <Animated.View 
          style={[
            styles.drawer, 
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          {renderDrawerContent()}
        </Animated.View>
        
        {activeSection !== 'dashboard' && activeSection !== 'users' && (
          <Text>Welcome to {adminOptions.find(option => option.section === activeSection)?.title}</Text>
        )}
        
        <View style={[styles.content, drawerOpen && styles.contentWithDrawer]}>
          {renderContent()}
        </View>
      </View>
      
      {/* Notification Center */}
      <NotificationCenter 
        visible={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        navigation={navigation}
        isAdmin={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#0066cc',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  contentContainer: {
    flex: 1,
  },
  drawer: {
    width: 250,
    backgroundColor: 'white',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  drawerHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  drawerItemText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#333',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contentWithDrawer: {
    marginLeft: 0,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  loader: {
    marginVertical: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendPositive: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  trendNegative: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 4,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginVertical: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeDrawerItem: {
    backgroundColor: '#0066cc',
  },
  activeDrawerItemText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  sectionContainer: {
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  quickActionsContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  quickActionsScroll: {
    flexDirection: 'row',
  },
  quickActionCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginRight: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    minWidth: 100,
    flexDirection: 'row',
  },
  quickActionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  customChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
    paddingTop: 20,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 20,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  chartValue: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  productCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  productStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  productStatCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 4,
  },
  productStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeBannerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  orderCategoriesContainer: {
    flexDirection: 'ro',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  orderStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  subItemsContainer: {
    backgroundColor: '#f5f5f5',
    paddingLeft: 20,
  },
  subItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  subItemText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 30, // Indent the sub-items
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContentText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  componentContainer: {
    flex: 1,
    padding: 0,
  },
  notificationButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    zIndex: 10,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default Admin;
