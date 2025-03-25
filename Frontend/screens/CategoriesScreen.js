import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Mock data - replace with your actual API call
const CATEGORIES = [
  { id: '1', name: 'Electronics', icon: 'phone-portrait-outline', items: 120 },
  { id: '2', name: 'Clothing', icon: 'shirt-outline', items: 85 },
  { id: '3', name: 'Home & Kitchen', icon: 'home-outline', items: 64 },
  { id: '4', name: 'Beauty', icon: 'color-palette-outline', items: 42 },
  { id: '5', name: 'Sports', icon: 'football-outline', items: 38 },
  { id: '6', name: 'Books', icon: 'book-outline', items: 93 },
  { id: '7', name: 'Toys', icon: 'game-controller-outline', items: 27 },
  { id: '8', name: 'Automotive', icon: 'car-outline', items: 19 },
];

const CategoriesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredCategory, setFeaturedCategory] = useState(null);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setCategories(CATEGORIES);
      setFeaturedCategory(CATEGORIES[0]);
      setLoading(false);
    }, 1000);
    
    // In a real app, replace with:
    // const fetchCategories = async () => {
    //   try {
    //     const response = await fetch('your-api-endpoint');
    //     const data = await response.json();
    //     setCategories(data);
    //     setFeaturedCategory(data[0]);
    //     setLoading(false);
    //   } catch (error) {
    //     console.error('Error fetching categories:', error);
    //     setLoading(false);
    //   }
    // };
    // fetchCategories();
  }, []);

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryItem}
      onPress={() => navigation.navigate('ProductList', { categoryId: item.id, categoryName: item.name })}
    >
      <View style={styles.categoryIconContainer}>
        <Ionicons name={item.icon} size={28} color="#3498db" />
      </View>
      <View style={styles.categoryTextContainer}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryCount}>{item.items} products</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#bbb" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {featuredCategory && (
        <TouchableOpacity 
          style={styles.featuredCategory}
          onPress={() => navigation.navigate('ProductList', { 
            categoryId: featuredCategory.id, 
            categoryName: featuredCategory.name 
          })}
        >
          <View style={styles.featuredContent}>
            <Text style={styles.featuredLabel}>Featured Category</Text>
            <Text style={styles.featuredName}>{featuredCategory.name}</Text>
            <View style={styles.featuredButton}>
              <Text style={styles.featuredButtonText}>Shop Now</Text>
            </View>
          </View>
          <View style={styles.featuredImageContainer}>
            <Ionicons name={featuredCategory.icon} size={60} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>All Categories</Text>
      
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  featuredCategory: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    overflow: 'hidden',
  },
  featuredContent: {
    flex: 1,
  },
  featuredLabel: {
    color: '#e0f0ff',
    fontSize: 14,
    marginBottom: 5,
  },
  featuredName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  featuredButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  featuredButtonText: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  featuredImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 15,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryCount: {
    fontSize: 13,
    color: '#888',
    marginTop: 3,
  },
});

export default CategoriesScreen;
