import React, { useEffect, useState } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen, { AuthResult } from './screens/LoginScreen';
import { Platform, PermissionsAndroid, Alert, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { startSmsListener } from './src/services/SmsListener';
import { GoogleDriveService } from './src/services/GoogleDriveService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = '@expenses_app:auth_result';

export default function App() {
  const [authResult, setAuthResult] = useState<AuthResult | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for persisted auth on app load
  useEffect(() => {
    async function checkPersistedAuth() {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsedAuth = JSON.parse(stored) as AuthResult;
          // Verify the token is still valid by making a test API call
          const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${parsedAuth.accessToken}` },
          });
          
          if (response.ok) {
            const userInfo = await response.json();
            // Update with fresh user info
            setAuthResult({ ...parsedAuth, user: userInfo });
          } else {
            // Token expired, clear storage
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.warn('Error checking persisted auth:', error);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        setIsCheckingAuth(false);
      }
    }
    
    checkPersistedAuth();
  }, []);

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
    // Persist the auth result
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result));
    } catch (error) {
      console.warn('Failed to persist auth result:', error);
    }
    
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

  // Show loading while checking persisted auth
  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
});
