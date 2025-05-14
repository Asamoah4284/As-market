import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NewArrivals = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome to New Arrivals</Text>
      <Text style={styles.subText}>Browse our complete collection of products</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default NewArrivals;
