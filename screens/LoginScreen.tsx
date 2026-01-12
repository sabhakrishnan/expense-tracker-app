import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../src/theme';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

export interface AuthResult {
  user: any;
  accessToken: string;
}

// Configure redirect URI for different platforms
const redirectUri = makeRedirectUri({
  scheme: 'expensetracker',
  path: Platform.OS === 'web' ? '' : undefined,
});

// Log redirect URI for debugging (remove in production)
console.log('Redirect URI:', redirectUri);

const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: (result: AuthResult) => void }) => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '817920016300-13a7jde06sr6ngupr8hdg8firigc5cuf.apps.googleusercontent.com', // Web client ID
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com', // Replace with your iOS client ID
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com', // Replace with your Android client ID
    webClientId: '817920016300-13a7jde06sr6ngupr8hdg8firigc5cuf.apps.googleusercontent.com',
    redirectUri: Platform.OS === 'web' ? 'https://sabhakrishnan.github.io/expense-tracker-app' : redirectUri,
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
            style={[styles.button, !request && styles.buttonDisabled]}
            onPress={() => promptAsync()}
            disabled={!request}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>
              <View style={styles.googleIconContainer}>
                <Text style={styles.googleIcon}>G</Text>
              </View>
              <Text style={styles.buttonText}>Continue with Google</Text>
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
});

export default LoginScreen;
