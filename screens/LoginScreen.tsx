import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, ResponseType } from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../src/theme';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

export interface AuthResult {
  user: any;
  accessToken: string;
}

// Google OAuth Client ID
const WEB_CLIENT_ID = '817920016300-13a7jde06sr6ngupr8hdg8firigc5cuf.apps.googleusercontent.com';

// Keys for OAuth state management
const OAUTH_TOKEN_KEY = 'oauth_pending_token';
const OAUTH_PROCESSING_KEY = 'oauth_callback_processing';

// Capture OAuth token from URL hash immediately (before React renders)
// This is crucial because the hash can be lost during page lifecycle
const captureOAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    if (accessToken) {
      // Store in sessionStorage immediately so it survives any page manipulations
      sessionStorage.setItem(OAUTH_TOKEN_KEY, accessToken);
      // Clear the hash from URL
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      return accessToken;
    }
  }
  
  // Check if we have a pending token from a previous capture
  return sessionStorage.getItem(OAUTH_TOKEN_KEY);
};

// Capture token immediately when this module loads
const pendingToken = captureOAuthToken();

const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: (result: AuthResult) => void }) => {
  const [isLoading, setIsLoading] = useState(!!pendingToken);
  const [isProcessingCallback, setIsProcessingCallback] = useState(!!pendingToken);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasProcessedCallback = useRef(false);

  // Handle OAuth callback on page load (for web)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (hasProcessedCallback.current) return;
    
    const accessToken = pendingToken || sessionStorage.getItem(OAUTH_TOKEN_KEY);
    
    if (accessToken) {
      hasProcessedCallback.current = true;
      setIsProcessingCallback(true);
      setIsLoading(true);
      
      console.log('Processing OAuth token...');
      
      // Fetch user info
      fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(userInfo => {
          console.log('OAuth callback successful, user:', userInfo.email);
          // Clear the pending token
          sessionStorage.removeItem(OAUTH_TOKEN_KEY);
          sessionStorage.removeItem(OAUTH_PROCESSING_KEY);
          onLoginSuccess({ user: userInfo, accessToken });
        })
        .catch(err => {
          console.error('Error fetching user info:', err);
          sessionStorage.removeItem(OAUTH_TOKEN_KEY);
          sessionStorage.removeItem(OAUTH_PROCESSING_KEY);
          setErrorMessage('Failed to sign in. Please try again.');
          setIsLoading(false);
          setIsProcessingCallback(false);
          hasProcessedCallback.current = false;
        });
    }
  }, [onLoginSuccess]);

  // For web, we'll use implicit grant flow
  const handleGoogleSignIn = async () => {
    if (Platform.OS === 'web') {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Detect the current base URL for the redirect
      const currentUrl = window.location.href.split('#')[0].split('?')[0];
      // Ensure it ends with /
      const redirectUri = currentUrl.endsWith('/') ? currentUrl : currentUrl + '/';
      
      console.log('Using redirect URI:', redirectUri);
      
      const scope = encodeURIComponent('profile email https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file');
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${WEB_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=${scope}` +
        `&include_granted_scopes=true` +
        `&prompt=select_account`;
      
      // Redirect to Google OAuth
      window.location.href = authUrl;
      return;
    }
    
    // For native platforms, use expo-auth-session
    promptAsync();
  };

  // Configure redirect URI for native platforms
  const redirectUri = makeRedirectUri({
    scheme: 'expensetracker',
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: WEB_CLIENT_ID,
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId: WEB_CLIENT_ID,
    redirectUri: redirectUri,
    scopes: [
      'profile', 
      'email', 
      'https://www.googleapis.com/auth/drive.appdata',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      async function getUserInfo() {
        if (authentication?.accessToken) {
          const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${authentication.accessToken}` },
          });
          const userInfo = await userInfoResponse.json();
          onLoginSuccess({ user: userInfo, accessToken: authentication.accessToken });
        }
      }
      getUserInfo();
    }
  }, [response]);

  // Show loading screen while processing OAuth callback
  if (isProcessingCallback) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={Colors.gradientPrimary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <View style={styles.logoBackground}>
                <Ionicons name="wallet" size={48} color={Colors.primary} />
              </View>
            </View>
            <Text style={styles.title}>Expense Tracker</Text>
            <Text style={styles.subtitle}>Signing you in...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.gradientPrimary as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative circles */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />

        <View style={styles.content}>
          {/* Logo/Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Ionicons name="wallet" size={48} color={Colors.primary} />
            </View>
          </View>

          {/* Welcome Text */}
          <Text style={styles.title}>Expense Tracker</Text>
          <Text style={styles.subtitle}>
            Track, share, and manage your{'\n'}expenses effortlessly
          </Text>

          {/* Error Message */}
          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="sync-outline" size={20} color="rgba(255,255,255,0.9)" />
              <Text style={styles.featureText}>Cloud Sync</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="people-outline" size={20} color="rgba(255,255,255,0.9)" />
              <Text style={styles.featureText}>Partner Mode</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="bar-chart-outline" size={20} color="rgba(255,255,255,0.9)" />
              <Text style={styles.featureText}>Analytics</Text>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>
              <View style={styles.googleIconContainer}>
                <Text style={styles.googleIcon}>G</Text>
              </View>
              <Text style={styles.buttonText}>{isLoading ? 'Signing in...' : 'Continue with Google'}</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.privacyText}>
            By continuing, you agree to our Terms of Service
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -80,
  },
  circle3: {
    width: 150,
    height: 150,
    bottom: -50,
    right: 50,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    width: '100%',
    maxWidth: 400,
  },
  logoContainer: {
    marginBottom: Spacing.xxl,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.xl,
  },
  title: {
    ...Typography.h1,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xxxl,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.xxxl,
    gap: Spacing.xl,
  },
  featureItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  featureText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  button: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    ...Shadows.lg,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  googleIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285F4',
  },
  buttonText: {
    ...Typography.label,
    color: Colors.text,
    fontSize: 16,
  },
  privacyText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: '#FEE2E2',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default LoginScreen;
