import { useEffect, useState } from 'react';
import { Db } from 'mongodb';
import { mongoDBService } from '../services/mongodb';

export function useDatabase() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [db, setDb] = useState<Db | null>(null);

  useEffect(() => {
    const connectDB = async () => {
      try {
        setIsLoading(true);
        await mongoDBService.connect();
        setDb(mongoDBService.getDb());
        setIsConnected(true);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setIsConnected(false);
        setDb(null);
      } finally {
        setIsLoading(false);
      }
    };

    connectDB();

    return () => {
      mongoDBService.disconnect().catch(console.error);
    };
  }, []);

  return { isConnected, isLoading, error, db };
} 