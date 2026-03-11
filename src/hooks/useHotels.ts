import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import type { Hotel, Employee } from '../types';

export function useHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHotelsAndEmployees = useCallback(async () => {
    setLoading(true);
    const [{ data: hotelsData, error: hotelsError }, { data: employeesData, error: employeesError }] = await Promise.all([
        supabase.from('hotels').select('*'),
        supabase.from('employees').select('*')
    ]);

    if (hotelsError) {
      console.error('Error fetching hotels:', hotelsError);
    }
    if (employeesError) {
        console.error('Error fetching employees:', employeesError);
    }

    if (employeesData) {
      setEmployees(employeesData as Employee[]);
    }

    if (hotelsData && employeesData) {
      const hotelsWithCounts = hotelsData.map(hotel => {
        const hotelEmployees = employeesData.filter(emp => emp.hotelId === hotel.id);
        return {
          ...hotel,
          totalEmployees: hotelEmployees.length,
          activeEmployees: hotelEmployees.filter(emp => emp.isActive).length,
        };
      });
      setHotels(hotelsWithCounts as Hotel[]);
    } else {
        setHotels(hotelsData as Hotel[] || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHotelsAndEmployees();
  }, [fetchHotelsAndEmployees]);

  const addHotel = async (hotelData: Partial<Hotel>) => {
    const processedData = { ...hotelData };
    if ((processedData.latitude as any) === '') processedData.latitude = null;
    if ((processedData.longitude as any) === '') processedData.longitude = null;

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
    if ((processedData.latitude as any) === '') processedData.latitude = null;
    if ((processedData.longitude as any) === '') processedData.longitude = null;

    // Remove frontend-only properties before sending to DB
    delete (processedData as any).totalEmployees;
    delete (processedData as any).activeEmployees;

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
    try {
      // 1. Eliminar datos dependientes primero para evitar error 409 (Foreign Key Constraints)
      
      // Eliminar registros de asistencia (Nombre correcto: attendance_records)
      await supabase.from('attendance_records').delete().eq('hotelId', id);
      
      // Eliminar solicitudes de personal (staffing_requests)
      await supabase.from('staffing_requests').delete().eq('hotel_id', id);
      
      // Eliminar empleados vinculados
      await supabase.from('employees').delete().eq('hotelId', id);

      // 2. Finalmente borrar el hotel
      const { error } = await supabase.from('hotels').delete().eq('id', id);
      
      if (error) {
        console.error('Error deleting hotel:', error);
        throw error;
      } else {
        setHotels(prev => prev.filter(h => h.id !== id));
      }
    } catch (err) {
      console.error('Fallo el proceso de eliminacion completa:', err);
      throw err;
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
    employees,
    loading,
    addHotel,
    updateHotel,
    deleteHotel,
    uploadHotelImage,
    refreshHotels: fetchHotelsAndEmployees,
  };
}
