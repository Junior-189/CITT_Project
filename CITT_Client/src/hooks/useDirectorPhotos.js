import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

let cachedPhotos = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export const useDirectorPhotos = () => {
  const { getAuthenticatedAxios } = useAuth();
  const [photos, setPhotos] = useState(cachedPhotos || {});
  const [loading, setLoading] = useState(!cachedPhotos);

  useEffect(() => {
    const now = Date.now();
    if (cachedPhotos && (now - cacheTime < CACHE_DURATION)) {
      setPhotos(cachedPhotos);
      setLoading(false);
      return;
    }
    const fetchPhotos = async () => {
      try {
        const api = getAuthenticatedAxios();
        const res = await api.get('/api/workspace/director-photos');
        const map = {};
        (res.data.photos || []).forEach(p => { map[p.department_code] = p.photo_url; });
        cachedPhotos = map;
        cacheTime = Date.now();
        setPhotos(map);
      } catch (e) { /* photos stay empty */ }
      setLoading(false);
    };
    fetchPhotos();
  }, []);

  return { photos, loading };
};
