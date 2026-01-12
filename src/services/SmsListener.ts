import { Platform, NativeEventEmitter, NativeModules } from 'react-native';
import { parseSmsToTransaction } from './SmsParserService';
import { TransactionStore } from './TransactionStore';

// Attempt to import a community SMS reading module. If it's not available, this module
// will gracefully no-op on iOS and log on Android.
let SmsReader: any = null;
try {
  // package: @maniac-tech/react-native-expo-read-sms
  // This package may only be available in some setups. We'll try-catch to avoid crashes.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SmsReader = require('@maniac-tech/react-native-expo-read-sms');
} catch (e) {
  SmsReader = null;
}

export async function startSmsListener() {
  if (Platform.OS !== 'android') {
    console.log('SMS listener is Android-only. Skipping on', Platform.OS);
    return;
  }

  if (!SmsReader) {
    console.warn('SmsReader module not found. Install @maniac-tech/react-native-expo-read-sms for background SMS support.');
    return;
  }

  try {
    // Request permission and start watching (API depends on module)
    if (typeof SmsReader.requestPermission === 'function') {
      const granted = await SmsReader.requestPermission();
      if (!granted) {
        console.warn('SMS permission not granted');
        return;
      }
    }

    // Subscribe to incoming SMS events
    const eventEmitter = new NativeEventEmitter(SmsReader);
    const subscription = eventEmitter.addListener('onSmsReceived', (sms: { body?: string }) => {
      try {
        const body = sms.body || '';
        const parsed = parseSmsToTransaction(body);
        if (parsed.matched && parsed.transaction) {
          // Persist as 'Review' so user can confirm
          TransactionStore.add(parsed.transaction).catch((e) => console.warn('Failed to store parsed sms', e));
        }
      } catch (err) {
        console.warn('Error processing incoming SMS', err);
      }
    });

    // If module has a start method, call it
    if (typeof SmsReader.start === 'function') {
      try {
        SmsReader.start();
      } catch (e) {
        console.warn('SmsReader.start() failed', e);
      }
    }

    console.log('SMS listener started');

    return () => {
      subscription.remove();
      if (typeof SmsReader.stop === 'function') SmsReader.stop();
    };
  } catch (error) {
    console.warn('Failed to start SMS listener', error);
  }
}

export default { startSmsListener };
