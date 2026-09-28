// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen';
import HomeScreen from './HomeScreen';
import ClockInConfirmation from './ClockInConfirmation';
import ClockOutConfirmation from './ClockOutConfirmation';
import DriverList from './DriverList';
import DriverCalendar from './DriverCalendar';
import DateSummary from './DateSummary';
import MapViewComponent from './MapViewComponent'; // Import your MapViewComponent

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ClockInConfirmation"
          component={ClockInConfirmation}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ClockOutConfirmation"
          component={ClockOutConfirmation}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DriverList"
          component={DriverList}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MapViewComponent" 
          component={MapViewComponent} 
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DriverCalendar"
          component={DriverCalendar}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DateSummary"
          component={DateSummary}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
