import { useState, useEffect } from 'react';

/**
 * Custom hook for handling async data fetching with loading and error states
 * @param {Function} fetchFunction - The async function to call
 * @param {Array} dependencies - Dependencies array for useEffect
 * @param {*} initialData - Initial data value
 * @returns {Object} { data, loading, error, refetch }
 */
export const useAsyncData = (fetchFunction, dependencies = [], initialData = null) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
};

export default useAsyncData;
