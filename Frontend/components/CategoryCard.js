import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const CategoryCard = memo(({ item, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={onPress}
    >
      <View style={[styles.categoryIconContainer, { backgroundColor: `${item.color}20` }]}>
        <MaterialIcons name={item.icon} size={28} color={item.color} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  categoryCard: {
    alignItems: 'center',
    marginHorizontal: 12,
    width: 50,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
  },
});

export default CategoryCard; 