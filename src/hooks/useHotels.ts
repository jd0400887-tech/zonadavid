import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import type { Hotel } from '../types';

export function useHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('hotels').select('*');
    if (error) {
      console.error('Error fetching hotels:', error);
    } else {
      setHotels(data as Hotel[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const addHotel = async (hotelData: Partial<Hotel>) => {
    const processedData = { ...hotelData };
    if (processedData.latitude === '') processedData.latitude = null;
    if (processedData.longitude === '') processedData.longitude = null;

    const newHotel: Hotel = {
      id: `hotel-${Date.now()}`,
      ...processedData,
    } as Hotel;
    const { data, error } = await supabase.from('hotels').insert([newHotel]).select();
    if (error) {
      console.error('Error adding hotel:', error);
      throw error;
    } else if (data) {
      setHotels(prev => [...prev, ...data as Hotel[]]);
    }
  };

  const updateHotel = async (updatedHotel: Partial<Hotel>) => {
    if (!updatedHotel.id) return;
    const processedData = { ...updatedHotel };
    if (processedData.latitude === '') processedData.latitude = null;
    if (processedData.longitude === '') processedData.longitude = null;

    const { data, error } = await supabase.from('hotels').update(processedData).eq('id', updatedHotel.id).select();
    if (error) {
      console.error('Error updating hotel:', error);
      throw error;
    } else if (data) {
      setHotels(prev =>
        prev.map(h =>
          h.id === updatedHotel.id ? { ...h, ...processedData } as Hotel : h
        )
      );
    }
  };

  const deleteHotel = async (id: string) => {
    const { error } = await supabase.from('hotels').delete().eq('id', id);
    if (error) {
      console.error('Error deleting hotel:', error);
    } else {
      setHotels(prev => prev.filter(h => h.id !== id));
    }
  };

  const uploadHotelImage = async (file: File, hotelId: string) => {
    const fileName = `${hotelId}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('hotel-images')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('hotel-images')
      .getPublicUrl(fileName);



    await updateHotel({ id: hotelId, imageUrl: publicUrl });
  };

  return {
    hotels,
    loading,
    addHotel,
    updateHotel,
    deleteHotel,
    uploadHotelImage,
    refreshHotels: fetchHotels,
  };
}
