import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchBar = ({ 
  searchQuery, 
  onSearchTextChange, 
  onSearchSubmit, 
  onClearSearch,
  onFetchOriginalProducts 
}) => {
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search products by name..."
        value={searchQuery}
        onChangeText={onSearchTextChange}
        onSubmitEditing={() => onSearchSubmit(searchQuery)}
        returnKeyType="search"
        placeholderTextColor="#999"
      />
      {searchQuery.length > 0 ? (
        <TouchableOpacity 
          onPress={() => {
            onClearSearch();
            onFetchOriginalProducts();
          }}
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={20} color="#999" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="mic" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    marginHorizontal: 16,
    marginTop: -20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  searchButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5D3FD3',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
});

export default SearchBar; 