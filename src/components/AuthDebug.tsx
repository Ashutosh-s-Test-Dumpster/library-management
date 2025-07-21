"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const useMock = 
  !process.env.NEXT_PUBLIC_SUPABASE_URL || 
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

interface DebugInfo {
  supabaseUrl: string;
  supabaseKey: string;
  connection: string;
  session: string;
}

export default function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    supabaseUrl: '',
    supabaseKey: '',
    connection: '',
    session: '',
  });

  useEffect(() => {
    // Skip debug checks in mock mode
    if (useMock) {
      setDebugInfo({
        supabaseUrl: 'Mock Mode',
        supabaseKey: 'Mock Mode',
        connection: 'Mock Mode',
        session: 'Mock Mode',
      });
      return;
    }

    const checkConfig = async () => {
      const debug = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        connection: 'Testing...',
        session: 'Checking...',
      };

      try {
        // Test basic connection
        const { error: sessionError } = await supabase.auth.getSession();
        debug.session = sessionError ? `Error: ${sessionError.message}` : 'OK';
        
        // Test database connection
        const { error } = await supabase.from('profiles').select('count').limit(1);
        debug.connection = error ? `Error: ${error.message}` : 'OK';
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        debug.connection = `Error: ${errorMessage}`;
      }

      setDebugInfo(debug);
    };

    checkConfig();
  }, []);

  return null; // Don't show in production

  return (
    <div className="fixed top-4 right-4 bg-red-900 text-white p-4 rounded-lg text-xs z-[999] max-w-xs">
      <h4 className="font-bold mb-2">Auth Debug Info</h4>
      <div>Supabase URL: {debugInfo.supabaseUrl}</div>
      <div>Supabase Key: {debugInfo.supabaseKey}</div>
      <div>Connection: {debugInfo.connection}</div>
      <div>Session: {debugInfo.session}</div>
    </div>
  );
} 