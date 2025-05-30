import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as Speech from 'expo-speech';
import { API_URL } from '../config/api';

const AIProductSearch = () => {
  const [prompt, setPrompt] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchProducts = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/assistant/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search products');
      }

      setProducts(data.products);

      // Text-to-speech announcement of results
      Speech.speak(`Found ${data.count} matching products`);

    } catch (err) {
      setError(err.message);
      Speech.speak('Sorry, there was an error searching for products');
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <Image
        source={{ uri: item.image }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
        <View style={styles.productTags}>
          <Text style={styles.tag}>{item.category}</Text>
          <Text style={styles.tag}>{item.color}</Text>
          <Text style={styles.tag}>{item.gender}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Describe what you're looking for..."
          value={prompt}
          onChangeText={setPrompt}
          onSubmitEditing={searchProducts}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={searchProducts}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        style={styles.productList}
        contentContainerStyle={styles.productListContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    height: 50,
    width: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  productList: {
    flex: 1,
  },
  productListContent: {
    padding: 8,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 200,
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  productTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
});

export default AIProductSearch;