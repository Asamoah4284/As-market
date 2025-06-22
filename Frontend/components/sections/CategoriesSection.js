import React, { memo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CategoryCard from '../CategoryCard';
import { CategorySkeleton } from '../SkeletonComponents';

const CATEGORIES = [
  { id: '1', name: 'Electronic', icon: 'devices', color: '#FF6B6B', categoryId: '1' },
  { id: '2', name: 'Fashion', icon: 'checkroom', color: '#4ECDC4', categoryId: '2' },
  { id: '3', name: 'Home', icon: 'home', color: '#FFD166', categoryId: '3' },
  { id: '4', name: 'Beauty', icon: 'spa', color: '#FF9F9F', categoryId: '4' },
  { id: '5', name: 'Sneakers', icon: 'sports-basketball', color: '#6A0572', categoryId: '5' },
  { id: '6', name: 'Books', icon: 'menu-book', color: '#1A535C', categoryId: '6' },
];

const CategoriesSection = memo(({ 
  categories = CATEGORIES, 
  isLoading, 
  navigation 
}) => {
  const handleCategoryPress = (item) => {
    try {
      navigation.navigate('CategoriesScreen', { 
        categoryId: item.categoryId,
        categoryName: item.name,
        filter: {
          categoryId: item.categoryId,
          category: item.name
        }
      });
    } catch (error) {
      console.error('Error handling category tap:', error);
    }
  };

  const renderCategory = ({ item }) => (
    <CategoryCard 
      item={item} 
      onPress={() => handleCategoryPress(item)} 
    />
  );

  if (isLoading) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CategoriesScreen')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={[1, 2, 3, 4, 5]}
          renderItem={() => <CategorySkeleton />}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CategoriesScreen')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  categoriesList: {
    paddingHorizontal: 12,
  },
});

export default CategoriesSection; 