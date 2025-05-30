import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Modal, 
  TextInput, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// Add categories array
const CATEGORIES = [
  { id: '1', name: 'Electronic', icon: 'devices', color: '#FF6B6B' },
  { id: '2', name: 'Fashion', icon: 'checkroom', color: '#4ECDC4' },
  { id: '3', name: 'Home', icon: 'home', color: '#FFD166' },
  { id: '4', name: 'Beauty', icon: 'spa', color: '#FF9F9F' },
  { id: '5', name: 'Sneakers', icon: 'sports-basketball', color: '#6A0572' },
  { id: '6', name: 'Books', icon: 'menu-book', color: '#1A535C' },
];

// Add subcategories for each main category
const SUBCATEGORIES = {
  '1': [ // Electronic
    'Smartphones',
    'Laptops',
    'Tablets',
    'Headphones',
    'Gaming',
    'Cameras',
    'Smart Watches',
    'Accessories',
    'Audio Equipment',
    'Computer Parts'
  ],
  '2': [ // Fashion
    'T-Shirts',
    'Shirts',
    'Dresses',
    'Pants/Jeans',
    'Shoes',
    'Bags',
    'Watches',
    'Jewelry',
    'Hats/Caps',
    'Underwear'
  ],
  '3': [ // Home
    'Furniture',
    'Kitchen Appliances',
    'Bedding',
    'Decor',
    'Lighting',
    'Storage',
    'Cleaning Supplies',
    'Garden',
    'Tools',
    'Bathroom'
  ],
  '4': [ // Beauty
    'Skincare',
    'Makeup',
    'Hair Care',
    'Fragrances',
    'Body Care',
    'Nail Care',
    'Beauty Tools',
    'Men\'s Grooming',
    'Supplements',
    'Organic/Natural'
  ],
  '5': [ // Sneakers
    'Running Shoes',
    'Basketball Shoes',
    'Casual Sneakers',
    'Formal Shoes',
    'Boots',
    'Sandals',
    'Sports Shoes',
    'Designer Sneakers',
    'Vintage/Retro',
    'Limited Edition'
  ],
  '6': [ // Books
    'Textbooks',
    'Fiction',
    'Non-Fiction',
    'Academic',
    'Reference',
    'Comics/Manga',
    'Self-Help',
    'Biographies',
    'Children\'s Books',
    'Educational'
  ]
};

const PendingProducts = () => {
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [featuredType, setFeaturedType] = useState('');
  const [featuredRank, setFeaturedRank] = useState('999');
  const [onSale, setOnSale] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState('0');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);
  const [subcategory, setSubcategory] = useState('');
  const [subcategoryDropdownVisible, setSubcategoryDropdownVisible] = useState(false);
  
  // For custom dropdown
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedFeaturedLabel, setSelectedFeaturedLabel] = useState('None');
  
  // Featured Type options
  const featuredOptions = [
    { label: 'None', value: '' },
    { label: 'New Arrivals', value: 'new-arrivals' },
    { label: 'Featured Products', value: 'featured' },
    { label: 'Featured Services', value: 'featured-service' },
    { label: 'Trending', value: 'trending' },
    { label: 'Special Offers', value: 'special-offers' },
    { label: 'Men', value: 'men' },
    { label: 'Women', value: 'women' },
    { label: 'Watches', value: 'watches' },
    { label: 'New Season', value: 'new-season' },
    { label: 'Premium', value: 'premium' }
  ];

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const fetchPendingProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/products/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch pending products');
      }
      
      const data = await response.json();
      setPendingProducts(data);
    } catch (error) {
      console.error('Error fetching pending products:', error);
      setError(error.message || 'Failed to load pending products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPendingProducts();
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setFeaturedType(product.featuredType || '');
    // Set the selected label based on the featured type
    const option = featuredOptions.find(opt => opt.value === (product.featuredType || ''));
    setSelectedFeaturedLabel(option ? option.label : 'None');
    
    setFeaturedRank(product.featuredRank.toString());
    setOnSale(product.onSale);
    setDiscountPercentage(product.discountPercentage.toString());
    setSubcategory(product.subcategory || '');
    
    // Initialize category selection based on existing categoryId
    if (product.categoryId) {
      const existingCategory = CATEGORIES.find(cat => cat.id === product.categoryId);
      if (existingCategory) {
        setSelectedCategory(existingCategory);
      }
    }
    
    setModalVisible(true);
  };
  
  const handleSelectFeaturedType = (option) => {
    setFeaturedType(option.value);
    setSelectedFeaturedLabel(option.label);
    setDropdownVisible(false);
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setCategoryDropdownVisible(false);
    // Reset subcategory when category changes
    setSubcategory('');
  };

  const handleSelectSubcategory = (subcategoryValue) => {
    setSubcategory(subcategoryValue);
    setSubcategoryDropdownVisible(false);
  };

  const handleApproveProduct = async (status) => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Validate category selection for approval
      if (status === 'approved' && !selectedCategory) {
        Alert.alert('Error', 'Please select a category before approving the product');
        setLoading(false);
        return;
      }
      
      // Build update data based on form state
      const updateData = {
        status,
        featuredType: featuredType === '' ? null : featuredType,
        featuredRank: parseInt(featuredRank),
        onSale,
        discountPercentage: parseInt(discountPercentage),
        subcategory: subcategory.trim() || null,
        category: selectedCategory ? selectedCategory.name : null,
        categoryId: selectedCategory ? selectedCategory.id : null,
        categoryColor: selectedCategory ? selectedCategory.color : null,
        categoryIcon: selectedCategory ? selectedCategory.icon : null
      };
      
      // Add rejection reason if rejecting
      if (status === 'rejected') {
        if (!rejectionReason.trim()) {
          Alert.alert('Error', 'Please provide a reason for rejection');
          setLoading(false);
          return;
        }
        updateData.rejectionReason = rejectionReason;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/products/admin-update/${selectedProduct._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to ${status} product`);
      }
      
      // Update local state by removing the product from the list
      setPendingProducts(pendingProducts.filter(p => p._id !== selectedProduct._id));
      
      Alert.alert(
        'Success', 
        `Product has been ${status === 'approved' ? 'approved' : 'rejected'}.`,
        [{ text: 'OK', onPress: () => setModalVisible(false) }]
      );
      
      // Reset form
      setRejectionReason('');
      setSelectedProduct(null);
      setSelectedCategory(null);
      setSubcategory('');
      
    } catch (error) {
      console.error(`Error ${status === 'approved' ? 'approving' : 'rejecting'} product:`, error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => handleViewProduct(item)}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.mainCategory || item.category}</Text>
        <View style={styles.productMeta}>
          <Text style={styles.productPrice}>GH₵{item.price.toFixed(2)}</Text>
          <Text style={styles.productSeller}>
            Seller: {item.seller.name || 'Unknown'}
          </Text>
        </View>
        <View style={styles.pendingTag}>
          <Text style={styles.pendingText}>Pending Review</Text>
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading pending products...</Text>
      </View>
    );
  }


  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <MaterialIcons name="error-outline" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPendingProducts}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <MaterialIcons name="refresh" size={24} color="#0066cc" />
        </TouchableOpacity>
      </View>
      
      {pendingProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="check-circle" size={64} color="#4cd964" />
          <Text style={styles.emptyText}>No pending products to review</Text>
          <Text style={styles.emptySubText}>
            All product submissions have been processed. Check back later for new submissions.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pendingProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
      
      {/* Product Review Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Review Product</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <MaterialIcons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalScroll}>
                  {/* Product Details */}
                  <View style={styles.productDetails}>
                    <Image 
                      source={{ uri: selectedProduct.image }} 
                      style={styles.modalProductImage} 
                    />
                    
                    <View style={styles.detailsContainer}>
                      <Text style={styles.detailLabel}>Name:</Text>
                      <Text style={styles.detailValue}>{selectedProduct.name}</Text>
                      
                      <Text style={styles.detailLabel}>Description:</Text>
                      <Text style={styles.detailValue}>{selectedProduct.description}</Text>
                      
                      <Text style={styles.detailLabel}>Price:</Text>
                      <Text style={styles.detailValue}>GH₵{selectedProduct.price.toFixed(2)}</Text>
                      
                      <Text style={styles.detailLabel}>Seller's Category:</Text>
                      <Text style={styles.detailValue}>{selectedProduct.mainCategory || selectedProduct.category || 'Not specified'}</Text>
                      
                      {selectedProduct.category && selectedProduct.category !== selectedProduct.mainCategory && (
                        <>
                          <Text style={styles.detailLabel}>Admin Assigned Category:</Text>
                          <Text style={styles.detailValue}>{selectedProduct.category}</Text>
                        </>
                      )}
                      
                      {selectedProduct.subcategory && (
                        <>
                          <Text style={styles.detailLabel}>Subcategory:</Text>
                          <Text style={styles.detailValue}>{selectedProduct.subcategory}</Text>
                        </>
                      )}
                      
                      <Text style={styles.detailLabel}>Stock:</Text>
                      <Text style={styles.detailValue}>{selectedProduct.stock}</Text>
                      
                      <Text style={styles.detailLabel}>Seller:</Text>
                      <Text style={styles.detailValue}>{selectedProduct.seller.name || 'Unknown'}</Text>
                      
                      <Text style={styles.detailLabel}>Type:</Text>
                      <Text style={styles.detailValue}>{selectedProduct.isService ? 'Service' : 'Product'}</Text>
                    </View>
                  </View>
                  
                  {/* Additional Images */}
                  {selectedProduct.additionalImages && selectedProduct.additionalImages.length > 0 && (
                    <View style={styles.additionalImagesContainer}>
                      <Text style={styles.sectionTitle}>Additional Images</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {selectedProduct.additionalImages.map((image, index) => (
                          <Image 
                            key={index} 
                            source={{ uri: image }} 
                            style={styles.additionalImage} 
                          />
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  
                  {/* Category Selection */}
                  <View style={styles.configSection}>
                    <Text style={styles.sectionTitle}>Category Assignment</Text>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Select Category:</Text>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => setCategoryDropdownVisible(true)}
                      >
                        <Text style={styles.dropdownButtonText}>
                          {selectedCategory ? selectedCategory.name : 'Select Category'}
                        </Text>
                        <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Subcategory (Optional):</Text>
                      {selectedCategory ? (
                        <TouchableOpacity 
                          style={styles.dropdownButton}
                          onPress={() => setSubcategoryDropdownVisible(true)}
                        >
                          <Text style={styles.dropdownButtonText}>
                            {subcategory || 'Select Subcategory'}
                          </Text>
                          <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
                        </TouchableOpacity>
                      ) : (
                        <View style={[styles.dropdownButton, {backgroundColor: '#f5f5f5'}]}>
                          <Text style={[styles.dropdownButtonText, {color: '#999'}]}>
                            Select category first
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Category Dropdown Modal */}
                  <Modal
                    transparent={true}
                    visible={categoryDropdownVisible}
                    animationType="fade"
                    onRequestClose={() => setCategoryDropdownVisible(false)}
                  >
                    <TouchableOpacity 
                      style={styles.dropdownOverlay}
                      activeOpacity={1}
                      onPress={() => setCategoryDropdownVisible(false)}
                    >
                      <View style={styles.dropdownContainer}>
                        <ScrollView>
                          {CATEGORIES.map((category) => (
                            <TouchableOpacity
                              key={category.id}
                              style={[
                                styles.dropdownItem,
                                selectedCategory?.id === category.id && styles.dropdownItemSelected
                              ]}
                              onPress={() => handleSelectCategory(category)}
                            >
                              <View style={styles.categoryDropdownItem}>
                                <MaterialIcons 
                                  name={category.icon} 
                                  size={24} 
                                  color={category.color} 
                                  style={styles.categoryIcon}
                                />
                                <Text style={[
                                  styles.dropdownItemText,
                                  selectedCategory?.id === category.id && styles.dropdownItemTextSelected
                                ]}>
                                  {category.name}
                                </Text>
                              </View>
                              {selectedCategory?.id === category.id && (
                                <MaterialIcons name="check" size={20} color="#0066cc" />
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </TouchableOpacity>
                  </Modal>
                  
                  {/* Subcategory Dropdown Modal */}
                  <Modal
                    transparent={true}
                    visible={subcategoryDropdownVisible}
                    animationType="fade"
                    onRequestClose={() => setSubcategoryDropdownVisible(false)}
                  >
                    <TouchableOpacity 
                      style={styles.dropdownOverlay}
                      activeOpacity={1}
                      onPress={() => setSubcategoryDropdownVisible(false)}
                    >
                      <View style={styles.dropdownContainer}>
                        <ScrollView>
                          {/* None/Clear option */}
                          <TouchableOpacity
                            style={[
                              styles.dropdownItem,
                              !subcategory && styles.dropdownItemSelected
                            ]}
                            onPress={() => handleSelectSubcategory('')}
                          >
                            <Text style={[
                              styles.dropdownItemText,
                              !subcategory && styles.dropdownItemTextSelected
                            ]}>
                              None (Clear Selection)
                            </Text>
                            {!subcategory && (
                              <MaterialIcons name="check" size={20} color="#0066cc" />
                            )}
                          </TouchableOpacity>
                          
                          {/* Subcategory options based on selected category */}
                          {selectedCategory && SUBCATEGORIES[selectedCategory.id]?.map((subcat) => (
                            <TouchableOpacity
                              key={subcat}
                              style={[
                                styles.dropdownItem,
                                subcategory === subcat && styles.dropdownItemSelected
                              ]}
                              onPress={() => handleSelectSubcategory(subcat)}
                            >
                              <Text style={[
                                styles.dropdownItemText,
                                subcategory === subcat && styles.dropdownItemTextSelected
                              ]}>
                                {subcat}
                              </Text>
                              {subcategory === subcat && (
                                <MaterialIcons name="check" size={20} color="#0066cc" />
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </TouchableOpacity>
                  </Modal>
                  
                  {/* Featured Section Configuration */}
                  <View style={styles.configSection}>
                    <Text style={styles.sectionTitle}>Assignment Options</Text>
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Featured Type:</Text>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => setDropdownVisible(true)}
                      >
                        <Text style={styles.dropdownButtonText}>{selectedFeaturedLabel}</Text>
                        <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
                      </TouchableOpacity>
                      
                      {/* Custom Dropdown Modal */}
                      <Modal
                        transparent={true}
                        visible={dropdownVisible}
                        animationType="fade"
                        onRequestClose={() => setDropdownVisible(false)}
                      >
                        <TouchableOpacity 
                          style={styles.dropdownOverlay}
                          activeOpacity={1}
                          onPress={() => setDropdownVisible(false)}
                        >
                          <View style={styles.dropdownContainer}>
                            <ScrollView>
                              {featuredOptions.map((option, index) => (
                                <TouchableOpacity
                                  key={index}
                                  style={[
                                    styles.dropdownItem,
                                    featuredType === option.value && styles.dropdownItemSelected
                                  ]}
                                  onPress={() => handleSelectFeaturedType(option)}
                                >
                                  <Text style={[
                                    styles.dropdownItemText,
                                    featuredType === option.value && styles.dropdownItemTextSelected
                                  ]}>
                                    {option.label}
                                  </Text>
                                  {featuredType === option.value && (
                                    <MaterialIcons name="check" size={20} color="#0066cc" />
                                  )}
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        </TouchableOpacity>
                      </Modal>
                    </View>
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Display Order (Rank):</Text>
                      <TextInput
                        style={styles.input}
                        value={featuredRank}
                        onChangeText={setFeaturedRank}
                        keyboardType="numeric"
                        placeholder="Enter display rank (lower = higher priority)"
                      />
                    </View>
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>On Sale:</Text>
                      <TouchableOpacity 
                        style={styles.toggleButton}
                        onPress={() => setOnSale(!onSale)}
                      >
                        <View style={[
                          styles.toggleTrack,
                          { backgroundColor: onSale ? '#4cd964' : '#e9e9e9' }
                        ]}>
                          <View style={[
                            styles.toggleThumb,
                            { transform: [{ translateX: onSale ? 22 : 0 }] }
                          ]} />
                        </View>
                        <Text style={styles.toggleText}>{onSale ? 'Yes' : 'No'}</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {onSale && (
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Discount Percentage:</Text>
                        <TextInput
                          style={styles.input}
                          value={discountPercentage}
                          onChangeText={setDiscountPercentage}
                          keyboardType="numeric"
                          placeholder="Enter discount percentage"
                        />
                      </View>
                    )}
                  </View>
                  
                  {/* Rejection Reason (only show if rejecting) */}
                  <View style={styles.rejectSection}>
                    <Text style={styles.sectionTitle}>Rejection Details</Text>
                    <Text style={styles.helperText}>
                      If you choose to reject this product, please provide a reason for the seller.
                    </Text>
                    <TextInput
                      style={styles.textArea}
                      multiline
                      numberOfLines={4}
                      placeholder="Reason for rejection (required if rejecting)"
                      value={rejectionReason}
                      onChangeText={setRejectionReason}
                    />
                  </View>
                  
                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleApproveProduct('rejected')}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <MaterialIcons name="close" size={20} color="#fff" />
                          <Text style={styles.buttonText}>Reject</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApproveProduct('approved')}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <MaterialIcons name="check" size={20} color="#fff" />
                          <Text style={styles.buttonText}>Approve</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
  },
  productSeller: {
    fontSize: 14,
    color: '#666',
  },
  pendingTag: {
    backgroundColor: '#ffc107',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  pendingText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '600',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#0066cc',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalScroll: {
    padding: 16,
  },
  modalProductImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  productDetails: {
    marginBottom: 24,
  },
  detailsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    marginBottom: 12,
  },
  additionalImagesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  additionalImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  configSection: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#fff',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '80%',
    maxHeight: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0f7ff',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: '#0066cc',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  toggleText: {
    marginLeft: 8,
  },
  rejectSection: {
    marginBottom: 24,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    height: 100,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
  },
  approveButton: {
    backgroundColor: '#4cd964',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  categoryDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    marginRight: 12,
  },
});

export default PendingProducts;
