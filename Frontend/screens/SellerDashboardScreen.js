import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Picker,
  Switch,
} from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const SellerDashboardScreen = () => {
  const navigation = useNavigation();
  const colors = {
    primary: '#4361EE',
    primaryDark: '#3730A3',
    secondary: '#6c757d',
    success: '#2EC4B6',
    danger: '#E63946',
    warning: '#FF9F1C',
    background: '#F8FAFC',
    cardBackground: '#ffffff',
    text: '#1A1B25',
    textSecondary: '#64748B',
    inputBackground: '#f1f3f5',
    border: '#E2E8F0',
    highlight: '#F0F4FF',
  };
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    stock: '',
    image: 'https://via.placeholder.com/150',
    additionalImages: [],
    isService: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [categories, setCategories] = useState({
    PRODUCTS: {
      CLOTHING_FASHION: 'Clothing & Fashion',
      ELECTRONICS: 'Electronics & Gadgets',
      SCHOOL_SUPPLIES: 'School Supplies',
      FOOD_DRINKS: 'Food & Drinks',
      BEAUTY_SKINCARE: 'Beauty & Skincare',
      HEALTH_FITNESS: 'Health & Fitness',
      FURNITURE_HOME: 'Furniture & Home Items',
      EVENT_TICKETS: 'Event Tickets & Merchandise'
    },
    SERVICES: {
      HOSTEL_AGENTS: 'Hostel Agents',
      ASSIGNMENT_HELP: 'Assignment Assistance',
      GRAPHIC_DESIGN: 'Graphic Design',
      PHOTO_VIDEO: 'Photography & Videography',
      LAUNDRY: 'Laundry Services',
      BARBER_HAIR: 'Barbering & Hairdressing',
      MC_DJ: 'MCs & DJs for Events',
      TUTORING: 'Tutoring & Lessons',
      FREELANCE_WRITING: 'Freelance Writing',
      TECH_SUPPORT: 'Tech Support'
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Only fetch products from API, remove mock data
      await fetchProducts();
      const ordersResponse = await mockFetchOrders();
      const chatsResponse = await mockFetchChats();
      
      setOrders(ordersResponse);
      setChats(chatsResponse);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Ensure products is set to empty array if there's an error
      setProducts([]);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken'); // Changed from 'token' to 'userToken'
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('http://172.20.10.3:5000/api/products/seller', {
        headers: {
          'Authorization': `Bearer ${token}`, // This will now use the correct token
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch products');
      }
      
      const data = await response.json();
      // Check if data is an array and has items
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]); // Ensure products is empty on error
      setErrorMessage('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const mockFetchOrders = () => {
    return Promise.resolve([
      { id: '1', customer: 'John Doe', date: '2023-05-15', status: 'Pending', total: 99.99, items: [{ productId: '1', quantity: 1 }] },
      { id: '2', customer: 'Jane Smith', date: '2023-05-14', status: 'Shipped', total: 149.97, items: [{ productId: '2', quantity: 3 }] },
      { id: '3', customer: 'Bob Johnson', date: '2023-05-13', status: 'Delivered', total: 29.99, items: [{ productId: '3', quantity: 1 }] },
    ]);
  };

  const mockFetchChats = () => {
    return Promise.resolve([
      { id: '1', customer: 'John Doe', lastMessage: 'Is this product still available?', timestamp: '10:30 AM', unread: 2 },
      { id: '2', customer: 'Jane Smith', lastMessage: 'Thanks for the quick delivery!', timestamp: 'Yesterday', unread: 0 },
      { id: '3', customer: 'Bob Johnson', lastMessage: 'When will my order ship?', timestamp: 'May 13', unread: 1 },
    ]);
  };

  const handleAddProduct = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsEditing(false);
    setProductForm({
      name: '',
      price: '',
      description: '',
      category: '',
      stock: '',
      image: 'https://via.placeholder.com/150',
      additionalImages: [],
      isService: false
    });
    setModalVisible(true);
  };

  const handleEditProduct = (product) => {
    setIsEditing(true);
    setCurrentProductId(product._id);
    setProductForm({
      name: product.name,
      price: product.price.toString(),
      description: product.description,
      category: product.category,
      stock: product.stock.toString(),
      image: product.image,
      additionalImages: product.additionalImages || [],
      isService: product.isService || false
    });
    setModalVisible(true);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const token = await AsyncStorage.getItem('userToken'); // Changed from 'token' to 'userToken'
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      
      // Update local state after successful deletion
      setProducts(products.filter(product => product._id !== productId));
      setSuccessMessage('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      setErrorMessage('Failed to delete product');
      // Fallback to local state update if API call fails - use _id instead of id
      setProducts(products.filter(product => product._id !== productId));
    }
  };

  const handleSaveProduct = async () => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      setLoading(true);
      
      // Validate form inputs
      if (!productForm.name || !productForm.price || !productForm.description || !productForm.category) {
        setErrorMessage('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      // Validate image
      if (!productForm.image) {
        setErrorMessage('Please select a main product image');
        setLoading(false);
        return;
      }
      
      // For services, stock might not be required
      if (!productForm.isService && !productForm.stock) {
        setErrorMessage('Please enter stock quantity for product');
        setLoading(false);
        return;
      }
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const productData = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price: parseFloat(productForm.price),
        category: productForm.category,
        stock: productForm.isService ? 1 : parseInt(productForm.stock),
        image: productForm.image,
        additionalImages: productForm.additionalImages.filter(img => img),
        isService: productForm.isService
      };
      
      // Use the same base URL as fetch products
      const baseUrl = 'http://172.20.10.3:5000';
      const url = isEditing 
        ? `${baseUrl}/api/products/${currentProductId}`
        : `${baseUrl}/api/products`;
        
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save product');
      }
      
      const savedProduct = await response.json();
      
      // Update products state
      if (isEditing) {
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product._id === currentProductId ? savedProduct : product
          )
        );
      } else {
        setProducts(prevProducts => [savedProduct, ...prevProducts]);
      }
      
      setSuccessMessage(isEditing ? 'Product updated successfully' : 'Product created successfully');
      setModalVisible(false);
      
      // Reset form
      setProductForm({
        name: '',
        price: '',
        description: '',
        category: '',
        stock: '',
        image: '',
        additionalImages: [],
        isService: false
      });
      setIsEditing(false);
      setCurrentProductId(null);

    } catch (error) {
      console.error('Error saving product:', error);
      setErrorMessage(error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    // In a real app, this would be an API call
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const renderProductItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.productImageContainer}>
        <Image source={{ uri: item.image }} style={styles.productImage} />
        <View style={styles.productBadge}>
          <Text style={styles.productBadgeText}>{item.category}</Text>
        </View>
        {item.stock < 5 && (
          <View style={styles.lowStockBadge}>
            <Text style={styles.lowStockText}>Low Stock</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
        <View style={styles.productMetrics}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: colors.primary }]}>${item.price.toFixed(2)}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Price</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: colors.text }]}>{item.stock}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>In Stock</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: colors.success }]}>{item.sales || 0}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Sold</Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>{item.rating || 0}</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <FontAwesome 
                key={star}
                name={star <= Math.floor(item.rating || 0) ? "star" : star <= (item.rating || 0) ? "star-half-o" : "star-o"} 
                size={14} 
                color={colors.warning} 
                style={styles.starIcon}
              />
            ))}
          </View>
        </View>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton, { backgroundColor: colors.highlight }]}
          onPress={() => handleEditProduct(item)}
        >
          <MaterialIcons name="edit" size={18} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton, { backgroundColor: colors.danger + '15' }]}
          onPress={() => handleDeleteProduct(item._id)}
        >
          <MaterialIcons name="delete" size={18} color={colors.danger} />
          <Text style={[styles.actionButtonText, { color: colors.danger }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOrderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.orderHeader}>
        <View style={styles.orderCustomerInfo}>
          <View style={styles.orderAvatar}>
            <Text style={styles.orderAvatarText}>{item.customer.charAt(0)}</Text>
          </View>
          <View>
            <Text style={[styles.orderCustomer, { color: colors.text }]}>{item.customer}</Text>
            <Text style={[styles.orderDate, { color: colors.textSecondary }]}>{item.date}</Text>
          </View>
        </View>
        <View style={[styles.orderStatus, { backgroundColor: getStatusColor(item.status).bg }]}>
          <Text style={[styles.orderStatusText, { color: getStatusColor(item.status).text }]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.orderDivider} />
      <View style={styles.orderDetails}>
        <View style={styles.orderItemCount}>
          <MaterialIcons name="shopping-bag" size={16} color={colors.textSecondary} />
          <Text style={[styles.orderItemCountText, { color: colors.textSecondary }]}>
            {item.items.reduce((sum, item) => sum + item.quantity, 0)} items
          </Text>
        </View>
        <Text style={[styles.orderTotal, { color: colors.primary }]}>
          ${item.total.toFixed(2)}
        </Text>
      </View>
      <View style={styles.orderActions}>
        {item.status === 'Pending' && (
          <TouchableOpacity 
            style={[styles.statusButton, { backgroundColor: colors.primary }]}
            onPress={() => handleUpdateOrderStatus(item.id, 'Shipped')}
          >
            <MaterialIcons name="local-shipping" size={16} color="white" />
            <Text style={styles.statusButtonText}>Ship Order</Text>
          </TouchableOpacity>
        )}
        {item.status === 'Shipped' && (
          <TouchableOpacity 
            style={[styles.statusButton, { backgroundColor: colors.success }]}
            onPress={() => handleUpdateOrderStatus(item.id, 'Delivered')}
          >
            <MaterialIcons name="check-circle" size={16} color="white" />
            <Text style={styles.statusButtonText}>Mark Delivered</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.viewButton, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
        >
          <Text style={[styles.viewButtonText, { color: colors.text }]}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.chatCard, { backgroundColor: colors.cardBackground }]}
      onPress={() => navigation.navigate('Chat', { chatId: item.id, customer: item.customer })}
    >
      <View style={[styles.chatAvatar, { backgroundColor: item.unread > 0 ? colors.primary : colors.secondary }]}>
        <Text style={styles.chatAvatarText}>{item.customer.charAt(0)}</Text>
        {item.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{item.unread}</Text>
          </View>
        )}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatCustomer, { color: colors.text }]}>{item.customer}</Text>
          <Text style={[styles.chatTimestamp, { color: colors.textSecondary }]}>{item.timestamp}</Text>
        </View>
        <Text 
          style={[styles.chatMessage, { color: item.unread > 0 ? colors.text : colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>
      <MaterialIcons 
        name="chevron-right" 
        size={24} 
        color={colors.textSecondary} 
        style={styles.chatArrow}
      />
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return { bg: '#FFF3CD', text: '#856404' };
      case 'Shipped':
        return { bg: '#D1ECF1', text: '#0C5460' };
      case 'Delivered':
        return { bg: '#D4EDDA', text: '#155724' };
      default:
        return { bg: '#F8F9FA', text: '#212529' };
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    switch (activeTab) {
      case 'products':
        return (
          <>
            <View style={styles.tabHeader}>
              <Text style={[styles.tabTitle, { color: colors.text }]}>My Products</Text>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={handleAddProduct}
              >
                <Text style={styles.addButtonText}>Add Product</Text>
                <MaterialIcons name="add" size={18} color="white" />
              </TouchableOpacity>
            </View>
            {products.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="inventory" size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  Welcome! Start by adding your first product.
                </Text>
                <TouchableOpacity 
                  style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddProduct}
                >
                  <Text style={styles.emptyStateButtonText}>Add New Product</Text>
                  <MaterialIcons name="add" size={18} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={products}
                renderItem={renderProductItem}
                keyExtractor={item => item._id || item.id}
                contentContainerStyle={styles.listContainer}
              />
            )}
          </>
        );
      case 'orders':
        return (
          <>
            <View style={styles.tabHeader}>
              <Text style={[styles.tabTitle, { color: colors.text }]}>Orders</Text>
            </View>
            {orders.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="shopping-bag" size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No orders yet. They'll appear here when customers make purchases.
                </Text>
              </View>
            ) : (
              <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
              />
            )}
          </>
        );
      case 'chats':
        return (
          <>
            <View style={styles.tabHeader}>
              <Text style={[styles.tabTitle, { color: colors.text }]}>Messages</Text>
            </View>
            {chats.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="chat" size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No messages yet. Conversations with buyers will appear here.
                </Text>
              </View>
            ) : (
              <FlatList
                data={chats}
                renderItem={renderChatItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
              />
            )}
          </>
        );
      default:
        return null;
    }
  };

  // Add this to your modal to display error/success messages
  const renderMessages = () => (
    <>
      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}
      
      {successMessage ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}
    </>
  );

  // Add this new component for the horizontal category selector
  const CategorySelector = ({ categories, selectedCategory, onSelect, type }) => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoryScrollView}
    >
      {Object.values(categories[type]).map((category, index) => (
        <TouchableOpacity
          key={`${type}-${index}`}
          style={[
            styles.categoryItem,
            selectedCategory === category && styles.categoryItemSelected
          ]}
          onPress={() => onSelect(category)}
        >
          <Text style={[
            styles.categoryItemText,
            selectedCategory === category && styles.categoryItemTextSelected
          ]}>
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const pickImage = async (isMain, index) => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        if (isMain) {
          setProductForm({ ...productForm, image: result.assets[0].uri });
        } else {
          const newImages = [...productForm.additionalImages];
          newImages[index] = result.assets[0].uri;
          setProductForm({ ...productForm, additionalImages: newImages });
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Error selecting image. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Seller Dashboard</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="notifications" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {renderTabContent()}
      </View>
      
      <View style={[styles.tabBar, { backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'products' && [styles.activeTab, { borderTopColor: colors.primary }]]}
          onPress={() => setActiveTab('products')}
        >
          <MaterialIcons 
            name="inventory" 
            size={24} 
            color={activeTab === 'products' ? colors.primary : colors.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'products' ? colors.primary : colors.textSecondary }
            ]}
          >
            Products
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'orders' && [styles.activeTab, { borderTopColor: colors.primary }]]}
          onPress={() => setActiveTab('orders')}
        >
          <MaterialIcons 
            name="shopping-bag" 
            size={24} 
            color={activeTab === 'orders' ? colors.primary : colors.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'orders' ? colors.primary : colors.textSecondary }
            ]}
          >
            Orders
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'chats' && [styles.activeTab, { borderTopColor: colors.primary }]]}
          onPress={() => setActiveTab('chats')}
        >
          <MaterialIcons 
            name="chat" 
            size={24} 
            color={activeTab === 'chats' ? colors.primary : colors.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'chats' ? colors.primary : colors.textSecondary }
            ]}
          >
            Messages
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {renderMessages()}
            
            <ScrollView style={styles.formContainer}>
              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Type</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity 
                    style={[
                      styles.typeButton,
                      !productForm.isService && styles.typeButtonSelected
                    ]}
                    onPress={() => setProductForm({...productForm, isService: false, category: ''})}
                  >
                    <MaterialIcons 
                      name="inventory" 
                      size={24} 
                      color={!productForm.isService ? colors.primary : colors.textSecondary} 
                    />
                    <Text style={[
                      styles.typeButtonText,
                      !productForm.isService && styles.typeButtonTextSelected
                    ]}>Product</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.typeButton,
                      productForm.isService && styles.typeButtonSelected
                    ]}
                    onPress={() => setProductForm({...productForm, isService: true, category: ''})}
                  >
                    <MaterialIcons 
                      name="miscellaneous-services" 
                      size={24} 
                      color={productForm.isService ? colors.primary : colors.textSecondary} 
                    />
                    <Text style={[
                      styles.typeButtonText,
                      productForm.isService && styles.typeButtonTextSelected
                    ]}>Service</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Category</Text>
                <CategorySelector 
                  categories={categories}
                  selectedCategory={productForm.category}
                  onSelect={(category) => setProductForm({...productForm, category})}
                  type={productForm.isService ? 'SERVICES' : 'PRODUCTS'}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
                <View style={styles.basicInfoContainer}>
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Name</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                      value={productForm.name}
                      onChangeText={(text) => setProductForm({...productForm, name: text})}
                      placeholder="Enter product name"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Price</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                      value={productForm.price}
                      onChangeText={(text) => setProductForm({...productForm, price: text})}
                      placeholder="Enter price"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  {!productForm.isService && (
                    <View style={styles.inputWrapper}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>Stock Quantity</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                        value={productForm.stock}
                        onChangeText={(text) => setProductForm({...productForm, stock: text})}
                        placeholder="Enter stock quantity"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                  
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
                    <TextInput
                      style={[styles.textArea, { backgroundColor: colors.inputBackground, color: colors.text }]}
                      value={productForm.description}
                      onChangeText={(text) => setProductForm({...productForm, description: text})}
                      placeholder="Enter product description"
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Product Images</Text>
                
                {/* Main Image */}
                <View style={styles.mainImageContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.mainImagePicker,
                      { backgroundColor: colors.inputBackground }
                    ]}
                    onPress={() => pickImage(true, null)}
                  >
                    {productForm.image ? (
                      <Image 
                        source={{ uri: productForm.image }}
                        style={styles.mainImagePreview}
                      />
                    ) : (
                      <View style={styles.mainImagePlaceholder}>
                        <MaterialIcons name="add-photo-alternate" size={40} color={colors.primary} />
                        <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                          Add Main Product Image
                        </Text>
                      </View>
                    )}
                    {productForm.image && (
                      <View style={styles.imageOverlay}>
                        <TouchableOpacity 
                          style={styles.changeImageButton}
                          onPress={() => pickImage(true, null)}
                        >
                          <MaterialIcons name="edit" size={20} color="white" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Additional Images */}
                <View style={styles.additionalImagesContainer}>
                  <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
                    Additional Images (Optional)
                  </Text>
                  <View style={styles.imageGrid}>
                    {[0, 1, 2].map((index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.additionalImagePicker,
                          { backgroundColor: colors.inputBackground }
                        ]}
                        onPress={() => pickImage(false, index)}
                      >
                        {productForm.additionalImages[index] ? (
                          <>
                            <Image
                              source={{ uri: productForm.additionalImages[index] }}
                              style={styles.additionalImagePreview}
                            />
                            <View style={styles.imageOverlay}>
                              <TouchableOpacity 
                                style={styles.changeImageButton}
                                onPress={() => pickImage(false, index)}
                              >
                                <MaterialIcons name="edit" size={16} color="white" />
                              </TouchableOpacity>
                            </View>
                          </>
                        ) : (
                          <View style={styles.additionalImagePlaceholder}>
                            <MaterialIcons name="add-photo-alternate" size={24} color={colors.textSecondary} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveProduct}
              >
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Update Product' : 'Create Product'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderTopWidth: 3,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addButtonText: {
    color: 'white',
    marginRight: 6,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 16,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 180,
  },
  productBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  productBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  lowStockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(230, 57, 70, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  lowStockText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  productMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9F1C',
    marginRight: 6,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starIcon: {
    marginRight: 2,
  },
  productActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  editButton: {
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  actionButtonText: {
    fontWeight: '600',
    marginLeft: 6,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  orderCustomerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4361EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderCustomer: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 14,
  },
  orderStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  orderItemCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderItemCountText: {
    marginLeft: 6,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  orderActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    justifyContent: 'flex-end',
    gap: 10,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  viewButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  chatAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#E63946',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  chatCustomer: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatTimestamp: {
    fontSize: 12,
  },
  chatMessage: {
    fontSize: 14,
  },
  chatArrow: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  emptyStateButtonText: {
    color: 'white',
    marginRight: 8,
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 8,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formContainer: {
    maxHeight: '90%',
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  typeButtonSelected: {
    backgroundColor: '#F0F4FF',
    borderColor: '#4361EE',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#6c757d',
  },
  typeButtonTextSelected: {
    color: '#4361EE',
    fontWeight: '600',
  },
  categoryScrollView: {
    flexGrow: 0,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F3F5',
    marginRight: 8,
  },
  categoryItemSelected: {
    backgroundColor: '#4361EE',
  },
  categoryItemText: {
    color: '#6c757d',
    fontSize: 14,
  },
  categoryItemTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  imageInputsContainer: {
    gap: 16,
  },
  mainImageContainer: {
    marginBottom: 24,
  },
  mainImagePicker: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  mainImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mainImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  additionalImagesContainer: {
    marginBottom: 24,
  },
  subTitle: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  imageGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  additionalImagePicker: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  additionalImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  additionalImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  changeImageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E63946',
  },
  errorText: {
    color: '#B71C1C',
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2EC4B6',
  },
  successText: {
    color: '#1B5E20',
  },
  basicInfoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
});

export default SellerDashboardScreen;
