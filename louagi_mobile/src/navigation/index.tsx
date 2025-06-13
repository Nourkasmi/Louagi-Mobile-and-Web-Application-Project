import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
// import { useSelector } from 'react-redux';
// import { RootState } from '../src/store/store';

const AppNavigator: React.FC = () => {
  // Uncomment below to use Redux for login state
  // const isLoggedIn = useSelector((state: RootState) => state.auth.isAuthenticated);

  const isLoggedIn = false; // Temporary placeholder

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
