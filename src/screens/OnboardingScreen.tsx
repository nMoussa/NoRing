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
import {useTranslation} from '../i18n/useTranslation';

type Props = StackScreenProps<RootStackParamList, 'Onboarding'>;
type Step = 'idle' | 'requesting' | 'waitingSettings' | 'done';

export default function OnboardingScreen({navigation}: Props) {
  const s = useTranslation();
  const [step, setStep] = useState<Step>('idle');
  const [androidStatus, setAndroidStatus] = useState<RoleStatus>('denied');
  const [iosStatus, setIosStatus] = useState<ExtensionStatus>('unknown');

  const checkStatus = useCallback(async () => {
    if (Platform.OS === 'android') {
      const status = await getAndroidRoleStatus();
      setAndroidStatus(status);
      if (status === 'granted') setStep('done');
    } else {
      const status = await getIOSExtensionStatus();
      setIosStatus(status);
      if (status === 'enabled') setStep('done');
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') checkStatus();
    });
    return () => sub.remove();
  }, [checkStatus]);

  const handleAndroidEnable = async () => {
    setStep('requesting');
    const granted = await requestAndroidRole();
    setStep(granted ? 'done' : 'idle');
    await checkStatus();
  };

  const handleIOSOpen = async () => {
    setStep('waitingSettings');
    await openIOSSettings();
  };

  const isPermitted =
    (Platform.OS === 'android' && androidStatus === 'granted') ||
    (Platform.OS === 'ios' && iosStatus === 'enabled') ||
    step === 'done';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title} accessibilityRole="header">
          {s.onboarding.title}
        </Text>
        <Text style={styles.subtitle}>{s.onboarding.subtitle}</Text>

        <View style={styles.card}>
          {Platform.OS === 'android' ? (
            <>
              <Text style={styles.heading}>{s.onboarding.android.heading}</Text>
              <Text style={styles.body}>{s.onboarding.android.body}</Text>
              {!isPermitted && (
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleAndroidEnable}
                  disabled={step === 'requesting'}
                  accessibilityLabel={s.onboarding.android.button}
                  accessibilityRole="button"
                  accessibilityState={{disabled: step === 'requesting'}}>
                  {step === 'requesting' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {s.onboarding.android.button}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={styles.heading}>{s.onboarding.ios.heading}</Text>
              <Text style={styles.body}>{s.onboarding.ios.body}</Text>
              {step === 'waitingSettings' && !isPermitted ? (
                <Text style={styles.pending}>{s.onboarding.ios.pending}</Text>
              ) : (
                !isPermitted && (
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleIOSOpen}
                    accessibilityLabel={s.onboarding.ios.button}
                    accessibilityRole="button">
                    <Text style={styles.buttonText}>
                      {s.onboarding.ios.button}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </>
          )}

          {isPermitted && (
            <View
              style={styles.successBox}
              accessibilityLiveRegion="polite"
              accessibilityLabel={s.onboarding.granted}>
              <Text style={styles.successText}>✓ {s.onboarding.granted}</Text>
            </View>
          )}
        </View>

        {isPermitted && (
          <TouchableOpacity
            style={[styles.button, styles.continueButton]}
            onPress={() => navigation.replace('Home')}
            accessibilityLabel={s.onboarding.continue}
            accessibilityRole="button">
            <Text style={styles.buttonText}>{s.onboarding.continue}</Text>
          </TouchableOpacity>
        )}

        {!isPermitted && (
          <TouchableOpacity
            style={styles.skipLink}
            onPress={() => navigation.replace('Home')}
            accessibilityLabel={s.onboarding.skip}
            accessibilityRole="button">
            <Text style={styles.skipText}>{s.onboarding.skip}</Text>
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
  heading: {fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 10},
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
