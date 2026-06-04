import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {StackScreenProps} from '@react-navigation/stack';
import type {RootStackParamList} from '../navigation/RootNavigator';
import {
  getAndroidRoleStatus,
  getIOSExtensionStatus,
  openIOSSettings,
  requestAndroidRole,
  type RoleStatus,
  type ExtensionStatus,
} from '../services/nativeBridge';

type Props = StackScreenProps<RootStackParamList, 'Onboarding'>;

type Step = 'idle' | 'requesting' | 'waitingSettings' | 'done';

export default function OnboardingScreen({navigation}: Props) {
  const [step, setStep] = useState<Step>('idle');
  const [androidStatus, setAndroidStatus] = useState<RoleStatus>('denied');
  const [iosStatus, setIosStatus] = useState<ExtensionStatus>('unknown');

  const checkStatus = useCallback(async () => {
    if (Platform.OS === 'android') {
      const s = await getAndroidRoleStatus();
      setAndroidStatus(s);
      if (s === 'granted') {
        setStep('done');
      }
    } else {
      const s = await getIOSExtensionStatus();
      setIosStatus(s);
      if (s === 'enabled') {
        setStep('done');
      }
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Re-check when app returns to foreground (user may have toggled iOS setting)
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        checkStatus();
      }
    });
    return () => sub.remove();
  }, [checkStatus]);

  const handleAndroidEnable = async () => {
    setStep('requesting');
    const granted = await requestAndroidRole();
    if (granted) {
      setStep('done');
    } else {
      setStep('idle');
    }
    await checkStatus();
  };

  const handleIOSOpen = async () => {
    setStep('waitingSettings');
    await openIOSSettings();
  };

  const handleContinue = () => {
    navigation.replace('Home');
  };

  const isPermitted =
    (Platform.OS === 'android' && androidStatus === 'granted') ||
    (Platform.OS === 'ios' && iosStatus === 'enabled') ||
    step === 'done';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>NoRing</Text>
        <Text style={styles.subtitle}>
          Block unwanted calls with custom rules
        </Text>

        <View style={styles.card}>
          {Platform.OS === 'android' ? (
            <>
              <Text style={styles.heading}>Set as Call Screener</Text>
              <Text style={styles.body}>
                NoRing needs to be your default call screener to filter calls in
                real time. Tap Enable and select NoRing in the next screen.
              </Text>
              {!isPermitted && (
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleAndroidEnable}
                  disabled={step === 'requesting'}>
                  {step === 'requesting' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Enable</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={styles.heading}>Enable Call Blocking</Text>
              <Text style={styles.body}>
                Open iOS Settings and turn on NoRing under Phone → Call
                Blocking &amp; Identification.
              </Text>
              {step === 'waitingSettings' && !isPermitted ? (
                <Text style={styles.pending}>
                  Waiting for you to enable NoRing in Settings…
                </Text>
              ) : (
                !isPermitted && (
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleIOSOpen}>
                    <Text style={styles.buttonText}>Open Settings</Text>
                  </TouchableOpacity>
                )
              )}
            </>
          )}

          {isPermitted && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                ✓ You're all set! NoRing is active.
              </Text>
            </View>
          )}
        </View>

        {isPermitted && (
          <TouchableOpacity
            style={[styles.button, styles.continueButton]}
            onPress={handleContinue}>
            <Text style={styles.buttonText}>Go to My Rules</Text>
          </TouchableOpacity>
        )}

        {!isPermitted && (
          <TouchableOpacity
            style={styles.skipLink}
            onPress={handleContinue}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {fontSize: 40, fontWeight: '800', color: '#007AFF', marginBottom: 8},
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 40,
  },
  card: {
    width: '100%',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
  },
  body: {fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 20},
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  continueButton: {width: '100%'},
  pending: {fontSize: 14, color: '#888', fontStyle: 'italic'},
  successBox: {
    backgroundColor: '#E8F8EF',
    borderRadius: 10,
    padding: 12,
  },
  successText: {color: '#1C8B3C', fontSize: 15, fontWeight: '500'},
  skipLink: {marginTop: 16},
  skipText: {color: '#8E8E93', fontSize: 14},
});
