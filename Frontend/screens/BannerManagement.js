import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Image, Alert, ActivityIndicator, Platform, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_BASE_URL } from '../config/api';

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    image: null,
    linkType: 'seller',
    linkId: '',
    title: '',
    description: '',
    buttonText: '',
    expiryDate: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/banners`);
      const data = await res.json();
      setBanners(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch banners');
    }
    setLoading(false);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setForm({ ...form, image: result.assets[0] });
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setForm({ ...form, expiryDate: selectedDate });
    }
  };

  const handleSubmit = async () => {
    if (!form.image || !form.linkId || !form.expiryDate) {
      Alert.alert('Validation', 'Image, Link, and Expiry Date are required');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: form.image.uri,
        name: 'banner.jpg',
        type: 'image/jpeg',
      });
      formData.append('linkType', form.linkType);
      formData.append('linkId', form.linkId);
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('buttonText', form.buttonText);
      formData.append('expiryDate', form.expiryDate.toISOString());
      // TODO: Add admin token to headers
      const res = await fetch(`${API_BASE_URL}/api/banners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          // 'Authorization': `Bearer ${adminToken}`
        },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to create banner');
      Alert.alert('Success', 'Banner created');
      setForm({
        image: null,
        linkType: 'seller',
        linkId: '',
        title: '',
        description: '',
        buttonText: '',
        expiryDate: new Date(),
      });
      setModalVisible(false);
      fetchBanners();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          // TODO: Add admin token to headers
          const res = await fetch(`${API_BASE_URL}/api/banners/${id}`, {
            method: 'DELETE',
            headers: {
              // 'Authorization': `Bearer ${adminToken}`
            },
          });
          if (!res.ok) throw new Error('Failed to delete');
          fetchBanners();
        } catch (e) {
          Alert.alert('Error', e.message);
        }
      }}
    ]);
  };

  const openModal = () => {
    setForm({
      image: null,
      linkType: 'seller',
      linkId: '',
      title: '',
      description: '',
      buttonText: '',
      expiryDate: new Date(),
    });
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* <Text style={styles.header}>Banner Management</Text> */}
      <TouchableOpacity style={styles.addButton} onPress={openModal}>
        <Text style={styles.addButtonText}>+ Add New Banner</Text>
      </TouchableOpacity>
      <Text style={styles.listHeader}>Active Banners</Text>
      {loading ? <ActivityIndicator /> : (
        <FlatList
          data={banners}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View style={styles.bannerItem}>
              <Image source={{ uri: item.image }} style={styles.bannerImage} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>{item.title}</Text>
                <Text style={styles.bannerDesc}>{item.description}</Text>
                <Text style={styles.bannerLink}>{item.linkType}: {item.linkId}</Text>
                <Text style={styles.bannerExpiry}>Expires: {new Date(item.expiryDate).toDateString()}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Add New Banner</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {form.image ? (
                <Image source={{ uri: form.image.uri }} style={styles.imagePreview} />
              ) : (
                <Text style={styles.imagePickerText}>Pick Banner Image</Text>
              )}
            </TouchableOpacity>
            <View style={styles.row}>
              <Text style={styles.label}>Link Type:</Text>
              <TouchableOpacity onPress={() => setForm({ ...form, linkType: 'seller' })} style={[styles.typeButton, form.linkType === 'seller' && styles.typeButtonActive]}>
                <Text style={form.linkType === 'seller' ? styles.typeButtonTextActive : styles.typeButtonText}>Seller</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setForm({ ...form, linkType: 'product' })} style={[styles.typeButton, form.linkType === 'product' && styles.typeButtonActive]}>
                <Text style={form.linkType === 'product' ? styles.typeButtonTextActive : styles.typeButtonText}>Product</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder={form.linkType === 'seller' ? 'Seller ID' : 'Product ID'}
              value={form.linkId}
              onChangeText={text => setForm({ ...form, linkId: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={form.title}
              onChangeText={text => setForm({ ...form, title: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={form.description}
              onChangeText={text => setForm({ ...form, description: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Button Text"
              value={form.buttonText}
              onChangeText={text => setForm({ ...form, buttonText: text })}
            />
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
              <Text style={styles.datePickerText}>Expiry: {form.expiryDate.toDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={form.expiryDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <TouchableOpacity style={[styles.submitButton, { flex: 1, marginRight: 8 }]} onPress={handleSubmit} disabled={submitting}>
                <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Create Banner'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelButton, { flex: 1, marginLeft: 8 }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  addButton: { backgroundColor: '#5D3FD3', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  form: { marginBottom: 24 },
  imagePicker: { alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8 },
  imagePickerText: { color: '#888' },
  imagePreview: { width: 120, height: 80, borderRadius: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { marginRight: 8 },
  typeButton: { padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginRight: 8 },
  typeButtonActive: { backgroundColor: '#5D3FD3', borderColor: '#5D3FD3' },
  typeButtonText: { color: '#333' },
  typeButtonTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 8 },
  datePickerButton: { padding: 8, backgroundColor: '#eee', borderRadius: 6, marginBottom: 8 },
  datePickerText: { color: '#333' },
  submitButton: { backgroundColor: '#5D3FD3', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  submitButtonText: { color: '#fff', fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#ccc', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  cancelButtonText: { color: '#333', fontWeight: 'bold' },
  listHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  bannerItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#f9f9f9', borderRadius: 8, padding: 8 },
  bannerImage: { width: 80, height: 50, borderRadius: 6, marginRight: 8 },
  bannerTitle: { fontWeight: 'bold' },
  bannerDesc: { color: '#555' },
  bannerLink: { color: '#888', fontSize: 12 },
  bannerExpiry: { color: '#b00', fontSize: 12 },
  deleteButton: { marginLeft: 8, backgroundColor: '#FF4757', padding: 8, borderRadius: 6 },
  deleteButtonText: { color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%', maxWidth: 400 },
  modalHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
});

export default BannerManagement; 