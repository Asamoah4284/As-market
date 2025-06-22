import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
  const [location, setLocation] = useState('Loading location...');
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    const getLocation = async () => {
      try {
        // Check if expo-location is available
        if (!Location) {
          console.log('Expo Location is not available');
          setLocation('UCC, Capecoast'); // Fallback location
          return;
        }
        
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('Location permission denied');
          setLocation('University of Capecoast, UCC'); // Fallback location
          setLocationPermission(false);
          return;
        }
        
        setLocationPermission(true);
        
        // Get current position
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        if (position) {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get the address
          const geocode = await Location.reverseGeocodeAsync({
            latitude,
            longitude
          });
          
          if (geocode && geocode.length > 0) {
            const address = geocode[0];
            // Build a more detailed location string
            const locationParts = [];
            
            // Add street/landmark if available
            if (address.street) {
              locationParts.push(address.street);
            }
            
            // Add sublocality (neighborhood/area) if available
            if (address.district) {
              locationParts.push(address.district);
            }
            
            // Add city if available
            if (address.city) {
              locationParts.push(address.city);
            }
            
            // Add region if available and different from city
            if (address.region && address.region !== address.city) {
              locationParts.push(address.region);
            }
            
            // Add country if available
            if (address.country) {
              locationParts.push(address.country);
            }
            
            // Join all parts with commas and remove any empty parts
            const locationString = locationParts
              .filter(part => part && part.trim() !== '')
              .join(', ');
            
            console.log('Detailed location detected:', locationString);
            setLocation(locationString || 'Location not available');
          } else {
            setLocation('Capecoast, Ghana');
          }
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setLocation('Location not available');
      }
    };
    
    getLocation();
  }, []);

  return { location, locationPermission };
}; 