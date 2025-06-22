import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export const useBanners = () => {
  const [banners, setBanners] = useState([]);
  const [isLoadingBanners, setIsLoadingBanners] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      setIsLoadingBanners(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/banners`);
        const data = await res.json();
        setBanners(data);
      } catch (e) {
        setBanners([]);
      } finally {
        // Simulate minimum loading time for better UX
        setTimeout(() => {
          setIsLoadingBanners(false);
        }, 1000);
      }
    };
    fetchBanners();
  }, []);

  const reloadBanners = async () => {
    try {
      const bannersResponse = await fetch(`${API_BASE_URL}/api/banners`);
      const bannersData = await bannersResponse.json();
      setBanners(bannersData);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setBanners([]);
    }
  };

  return {
    banners,
    isLoadingBanners,
    reloadBanners,
  };
}; 