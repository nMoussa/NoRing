import 'react-native-gesture-handler';
import React, {useEffect} from 'react';
import {StyleSheet} from 'react-native';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import RootNavigator from './src/navigation/RootNavigator';
import {initPlatformSync} from './src/services/platformSync';
import {useRulesStore} from './src/store/rulesStore';

function AppInner() {
  const loadFromStorage = useRulesStore(s => s.loadFromStorage);

  useEffect(() => {
    initPlatformSync();
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppInner />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
});
