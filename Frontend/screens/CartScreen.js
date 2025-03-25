import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const CartScreen = () => {
  const navigation = useNavigation();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with your actual data fetching logic
  useEffect(() => {
    // Simulate fetching cart data
    setTimeout(() => {
      setCartItems([
        {
          id: '1',
          name: 'Wireless Headphones',
          price: 129.99,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
        },
        {
          id: '2',
          name: 'Smart Watch',
          price: 249.99,
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
        },
        {
          id: '3',
          name: 'Bluetooth Speaker',
          price: 79.99,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const updateQuantity = (id, action) => {
    setCartItems(
      cartItems.map(item => {
        if (item.id === id) {
          if (action === 'increase') {
            return { ...item, quantity: item.quantity + 1 };
          } else if (action === 'decrease' && item.quantity > 1) {
            return { ...item, quantity: item.quantity - 1 };
          }
        }
        return item;
      })
    );
  };

  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price}</Text>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, 'decrease')}
          >
            <Ionicons name="remove" size={18} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.quantity}</Text>
          
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, 'increase')}
          >
            <Ionicons name="add" size={18} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeItem(item.id)}
      >
        <Ionicons name="trash-outline" size={22} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5E72E4" />
        <Text style={styles.loadingText}>Loading your cart...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={styles.placeholder} />
      </View>

      {cartItems.length > 0 ? (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Subtotal</Text>
              <Text style={styles.summaryValue}>${calculateTotal()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Shipping</Text>
              <Text style={styles.summaryValue}>$5.99</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalText}>Total</Text>
              <Text style={styles.totalValue}>${(parseFloat(calculateTotal()) + 5.99).toFixed(2)}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={() => navigation.navigate('Checkout')}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyCartContainer}>
          <Ionicons name="cart-outline" size={100} color="#ccc" />
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => navigation.navigate('Shop')}
          >
            <Text style={styles.shopButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5E72E4',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 12,
  },
  removeButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5E72E4',
  },
  checkoutButton: {
    backgroundColor: '#5E72E4',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#5E72E4',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CartScreen;
