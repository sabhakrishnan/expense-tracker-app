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

// PKCE helpers and state keys for web OAuth
const PKCE_VERIFIER_KEY = 'pkce_code_verifier';
const OAUTH_PROCESSING_KEY = 'oauth_callback_processing';

const base64UrlEncode = (arrayBuffer: ArrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const digest = await (window.crypto.subtle || (window as any).msCrypto.subtle).digest('SHA-256', data);
  return digest;
};

const generateCodeVerifier = () => {
  const array = new Uint8Array(128);
  (window.crypto.getRandomValues as any)(array);
  return base64UrlEncode(array.buffer);
};

const generateCodeChallenge = async (verifier: string) => {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
};

const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: (result: AuthResult) => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasProcessedCallback = useRef(false);

  // For web, use Authorization Code + PKCE flow
  const handleGoogleSignIn = async () => {
    if (Platform.OS === 'web') {
      setIsLoading(true);
      setErrorMessage(null);

      const redirectUri = 'https://sabhakrishnan.github.io/expense-tracker-app/';
      const scope = encodeURIComponent('openid profile email https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file');

      // generate PKCE values
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);

      const state = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem(OAUTH_PROCESSING_KEY, state);

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${WEB_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${scope}` +
        `&code_challenge=${encodeURIComponent(challenge)}` +
        `&code_challenge_method=S256` +
        `&state=${encodeURIComponent(state)}` +
        `&prompt=select_account`;

      window.location.href = authUrl;
      return;
    }

    // For native platforms, use expo-auth-session
    promptAsync();
  };

  // On web, check for code in URL and exchange it for tokens
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    const storedState = sessionStorage.getItem(OAUTH_PROCESSING_KEY);
    const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);

    if (code && state && storedState && state === storedState && verifier && !hasProcessedCallback.current) {
      hasProcessedCallback.current = true;
      // clear state from storage
      sessionStorage.removeItem(OAUTH_PROCESSING_KEY);
      setIsProcessingCallback(true);
      setIsLoading(true);

      const redirectUri = 'https://sabhakrishnan.github.io/expense-tracker-app/';

      // Exchange code for token
      (async () => {
        try {
          const body = new URLSearchParams();
          body.append('code', code);
          body.append('client_id', WEB_CLIENT_ID);
          body.append('redirect_uri', redirectUri);
          body.append('grant_type', 'authorization_code');
          body.append('code_verifier', verifier);

          const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
          });

          if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            throw new Error('Token exchange failed: ' + errText);
          }

          const tokenData = await tokenRes.json();
          const accessToken = tokenData.access_token;

          // Fetch user info
          const userRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!userRes.ok) throw new Error('Failed fetching user info');
          const userInfo = await userRes.json();

          // cleanup URL (remove code/state)
          const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);

          sessionStorage.removeItem(PKCE_VERIFIER_KEY);
          onLoginSuccess({ user: userInfo, accessToken });
        } catch (err: any) {
          console.error(err);
          setErrorMessage('Sign-in failed: ' + (err.message || err));
          setIsLoading(false);
          setIsProcessingCallback(false);
          hasProcessedCallback.current = false;
        }
      })();
    }
  }, [onLoginSuccess]);

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
