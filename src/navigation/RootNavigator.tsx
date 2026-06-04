import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import RuleEditorScreen from '../screens/RuleEditorScreen';
import SimulatorScreen from '../screens/SimulatorScreen';
import DiagnosticsScreen from '../screens/DiagnosticsScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  RuleEditor: {ruleId?: string};
  Simulator: undefined;
  Diagnostics: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Onboarding"
      screenOptions={{
        headerStyle: {backgroundColor: '#fff'},
        headerTintColor: '#007AFF',
        headerTitleStyle: {color: '#000', fontWeight: '600'},
        cardStyle: {backgroundColor: '#F2F2F7'},
      }}>
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="RuleEditor"
        component={RuleEditorScreen}
        options={({route}) => ({
          title: route.params?.ruleId ? 'Edit Rule' : 'New Rule',
          presentation: 'modal',
        })}
      />
      <Stack.Screen
        name="Simulator"
        component={SimulatorScreen}
        options={{title: 'Simulator'}}
      />
      <Stack.Screen
        name="Diagnostics"
        component={DiagnosticsScreen}
        options={{title: 'Diagnostics'}}
      />
    </Stack.Navigator>
  );
}
