import React from 'react';
import { Slot } from 'expo-router';
import { Provider } from 'react-redux';
import store from '../src/store/store';
import { PaperProvider } from 'react-native-paper';

const RootLayout: React.FC = () => {
  return (
    <Provider store={store}>
      <PaperProvider>
        <Slot />
      </PaperProvider>
    </Provider>
  );
};

export default RootLayout;
