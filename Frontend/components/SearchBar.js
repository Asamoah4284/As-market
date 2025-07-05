import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Modal, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchBar = ({ 
  searchQuery, 
  onSearchTextChange, 
  onSearchSubmit, 
  onClearSearch,
  onFetchOriginalProducts,
  showPopupSearch = false,
  onTogglePopupSearch 
}) => {
  const searchInputRef = useRef(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSearchFocused) {
        searchInputRef.current?.blur();
        return true; // Prevent default back behavior
      }
      if (showPopup) {
        setShowPopup(false);
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    });

    return () => backHandler.remove();
  }, [isSearchFocused, showPopup]);

  const handleFocus = () => {
    setIsSearchFocused(true);
  };

  const handleBlur = () => {
    setIsSearchFocused(false);
  };

  const handleClearSearch = () => {
    onClearSearch();
    onFetchOriginalProducts();
    searchInputRef.current?.blur();
  };

  const handlePopupToggle = () => {
    setShowPopup(!showPopup);
    if (onTogglePopupSearch) {
      onTogglePopupSearch(!showPopup);
    }
  };

  const handlePopupSearch = (query) => {
    onSearchTextChange(query);
    onSearchSubmit(query);
    setShowPopup(false);
  };

  const renderPopupSearch = () => (
    <Modal
      visible={showPopup}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowPopup(false)}
    >
      <View style={styles.popupOverlay}>
        <View style={styles.popupContainer}>
          <View style={styles.popupHeader}>
            <Ionicons name="search" size={24} color="#5D3FD3" />
            <TouchableOpacity 
              onPress={() => setShowPopup(false)}
              style={styles.popupCloseButton}
            >
              <Ionicons name="close" size={24} color="#999" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.popupSearchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.popupSearchInput}
              placeholder="Search products by name..."
              value={searchQuery}
              onChangeText={onSearchTextChange}
              onSubmitEditing={() => handlePopupSearch(searchQuery)}
              returnKeyType="search"
              placeholderTextColor="#999"
              autoFocus={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={handleClearSearch}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.popupSearchButton}
            onPress={() => handlePopupSearch(searchQuery)}
          >
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search products by name..."
          value={searchQuery}
          onChangeText={onSearchTextChange}
          onSubmitEditing={() => onSearchSubmit(searchQuery)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          placeholderTextColor="#999"
          blurOnSubmit={true}
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity 
            onPress={handleClearSearch}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handlePopupToggle}
          >
            <Ionicons name="options" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      
      {renderPopupSearch()}
    </>
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
  // Pop-up search styles
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  popupCloseButton: {
    padding: 4,
  },
  popupSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 15,
  },
  popupSearchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  popupSearchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#5D3FD3',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
});

export default SearchBar; 