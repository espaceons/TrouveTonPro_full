// App.js 
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { I18nManager } from 'react-native';

// استيراد مكونات الشاشات (Imports des écrans)
import WorkersListScreen from './src/screens/WorkersListScreen';
import WorkerDetailScreen from './src/screens/WorkerDetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  // NOTE IMPORTANTE:
  // Pour activer le RTL (Right-to-Left) sur iOS/Android, vous devrez
  // parfois décommenter ces lignes, redémarrer le serveur, PUIS
  // redémarrer MANUELLEMENT l'application sur le téléphone/émulateur.
  // I18nManager.forceRTL(true); 
  // I18nManager.allowRTL(true); 

  return (
    // الحاوية الرئيسية للملاحة (Conteneur de Navigation)
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: '#007AFF' },
            headerTintColor: '#fff', 
            headerTitleAlign: I18nManager.isRTL ? 'right' : 'left', 
        }}
      >
        {/* الشاشة 1: قائمة المهنيين (Écran Liste) */}
        <Stack.Screen 
          name="WorkersList" 
          component={WorkersListScreen}
          options={{ title: 'ابحث عن المهني الخاص بك' }} 
        />
        
        {/* الشاشة 2: تفاصيل المهني (Écran Détail) */}
        <Stack.Screen 
          name="WorkerDetail" 
          component={WorkerDetailScreen} 
          options={{ title: 'تفاصيل المهني' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}