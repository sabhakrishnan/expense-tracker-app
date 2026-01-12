import React, { useEffect, useState } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen, { AuthResult } from './screens/LoginScreen';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { startSmsListener } from './src/services/SmsListener';
import { GoogleDriveService } from './src/services/GoogleDriveService';

export default function App() {
  const [authResult, setAuthResult] = useState<AuthResult | null>(null);

  useEffect(() => {
    async function initAndroidSms() {
      if (Platform.OS !== 'android') return;

      try {
        const grantedReceive = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          {
            title: 'SMS Permission',
            message: 'This app needs permission to receive SMS to auto-detect transactions.',
            buttonPositive: 'OK',
          }
        );

        const grantedRead = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          {
            title: 'SMS Read Permission',
            message: 'This app needs permission to read SMS for transaction parsing.',
            buttonPositive: 'OK',
          }
        );

        if (grantedReceive !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission denied', 'Receive SMS permission was not granted. Background SMS detection will be limited.');
        }

        const stop = startSmsListener();
        return () => {
          if (typeof stop === 'function') stop();
        };
      } catch (err) {
        console.warn('Failed to request SMS permissions', err);
      }
    }

    const cleanupPromise = initAndroidSms();
    return () => {
      // If initAndroidSms returned a cleanup function, call it when component unmounts
      Promise.resolve(cleanupPromise).then((fn) => {
        if (typeof fn === 'function') fn();
      });
    };
  }, []);

  const handleLoginSuccess = async (result: AuthResult) => {
    setAuthResult(result);
    // Sync transactions with Google Drive on login (includes partner transactions if enabled)
    try {
      console.log('Syncing with Google Drive...');
      const userEmail = result.user?.email || '';
      const synced = await GoogleDriveService.syncWithPartner(result.accessToken, userEmail);
      console.log(`Synced ${synced.length} transactions (including partner's if enabled)`);
    } catch (error) {
      console.warn('Failed to sync with Google Drive:', error);
    }
  };

  if (!authResult) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AppNavigator 
      accessToken={authResult.accessToken} 
      userEmail={authResult.user?.email || ''} 
    />
  );
}
