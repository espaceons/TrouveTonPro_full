// src/screens/WorkerDetailScreen.js

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Linking, 
  TouchableOpacity, 
  I18nManager, 
  ActivityIndicator, 
  Image 
} from 'react-native';
import { SafeAreaView as ContextSafeAreaView } from 'react-native-safe-area-context'; 
import { Feather } from '@expo/vector-icons';

// --- CONFIGURATION API CENTRALISÉE ---
const IP = 'http://172.16.172.70:8000'; // Votre adresse IP machine + port Django
const BASE_API_URL = `${IP}/api/workers/`; 
// -------------------------------------

const WorkerDetailScreen = ({ route, navigation }) => {
  const { workerId, workerName } = route.params;
  const [worker, setWorker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // LOGIQUE DE RÉCUPÉRATION DES DONNÉES DE DÉTAIL
  useEffect(() => {
    // Met à jour le titre de l'écran avec le nom du professionnel
    if (workerName) {
      navigation.setOptions({ title: workerName });
    }

    const fetchWorkerDetail = async () => {
      try {
        // Utilisation de BASE_API_URL + workerId
        const response = await fetch(`${BASE_API_URL}${workerId}/`);
        
        if (!response.ok) {
           // Si la requête échoue (ex: 404), on lève une erreur
           throw new Error(`Erreur HTTP: ${response.status} pour l'ID ${workerId}`);
        }
        
        const data = await response.json();
        setWorker(data);
        navigation.setOptions({ title: `${data.first_name} ${data.last_name}` });
      } catch (err) {
        console.error("Erreur de l'API Détail:", err);
        setError(`Impossible de charger les détails. Vérifiez la connexion à ${IP}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkerDetail();
  }, [workerId, workerName, navigation]);

  // FONCTION DE CONTACT : APPEL TÉLÉPHONIQUE
  const handleCall = () => {
    if (worker && worker.phone) {
        Linking.openURL(`tel:${worker.phone}`);
    }
  };

  // FONCTION DE CONTACT : WHATSAPP
  const handleWhatsApp = () => {
    const number = worker?.whatsapp_number;
    
    if (number) {
        const url = `whatsapp://send?phone=${number}`;
        
        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(url);
                } else {
                    alert(`Veuillez installer WhatsApp pour contacter ${worker.first_name}.`);
                }
            })
            .catch((err) => console.error('Erreur lors de l\'ouverture de WhatsApp', err));
    }
  };

  // RENDU CONDITIONNEL (Chargement)
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>جاري تحميل التفاصيل... ⏳</Text>
      </View>
    );
  }
  
  // Rendu pour l'erreur de chargement
  if (error) {
     return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <Text style={styles.subErrorText}>Veuillez vérifier votre serveur .</Text>
        </View>
     );
  }

  // Rendu des Détails
  return (
    <ContextSafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          {/* AFFICHAGE DE L'IMAGE : Utilisation du champ 'worker.image' */}
          <Image 
            source={{ uri: worker.image }} 
            style={styles.profileImage} 
          />
          <View style={styles.titleGroup}>
            <Text style={styles.name}>{worker.first_name} {worker.last_name}</Text>
            <Text style={styles.category}>{worker.category}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>المدينة:</Text>
          <Text style={styles.value}>{worker.city}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>التقييم:</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.value}>{worker.rating}</Text>
            <Feather name="star" size={16} color="#FFD700" style={{ marginRight: 5 }} />
          </View>
        </View>

        <View style={styles.bioContainer}>
          <Text style={styles.bioTitle}>السيرة الذاتية والخبرة:</Text>
          <Text style={styles.bioText}>{worker.bio}</Text>
        </View>

        <View style={styles.buttonContainer}>
          {/* BOUTON D'APPEL */}
          <TouchableOpacity style={[styles.button, styles.callButton]} onPress={handleCall}>
            <Feather name="phone" size={20} color="white" style={{ marginRight: 5 }} />
            <Text style={styles.buttonText}>اتصل بـ {worker.first_name}</Text>
          </TouchableOpacity>
          
          {/* BOUTON WHATSAPP */}
          {worker.whatsapp_number && (
            <TouchableOpacity style={[styles.button, styles.whatsappButton]} onPress={handleWhatsApp}>
              <Feather name="message-circle" size={20} color="white" style={{ marginRight: 5 }} />
              <Text style={styles.buttonText}>راسل على WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ContextSafeAreaView>
  );
};

// --- Styles pour WorkerDetailScreen ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0', alignItems: 'center', paddingTop: 20 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
  loadingText: { fontSize: 18, color: '#007AFF', marginTop: 10 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 18, color: 'red', fontWeight: 'bold', textAlign: 'center' },
  subErrorText: { fontSize: 14, color: '#666', marginTop: 10 },
  card: { backgroundColor: 'white', borderRadius: 10, padding: 20, marginHorizontal: 16, width: '90%', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start' },
  header: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15, marginBottom: 15 },
  profileImage: { // Style pour l'image de profil
    width: 80,
    height: 80,
    borderRadius: 40, 
    borderWidth: 3,
    borderColor: '#007AFF',
    marginRight: I18nManager.isRTL ? 0 : 15,
    marginLeft: I18nManager.isRTL ? 15 : 0,
  },
  titleGroup: { marginLeft: I18nManager.isRTL ? 0 : 15, marginRight: I18nManager.isRTL ? 15 : 0, alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start' },
  name: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  category: { fontSize: 18, color: '#007AFF', marginTop: 2 },
  detailRow: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  label: { fontSize: 16, fontWeight: '600', color: '#555' },
  value: { fontSize: 16, color: '#333' },
  ratingContainer: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center' },
  bioContainer: { marginTop: 15, paddingTop: 10 },
  bioTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, textAlign: I18nManager.isRTL ? 'right' : 'left' },
  bioText: { fontSize: 16, color: '#666', lineHeight: 24, textAlign: I18nManager.isRTL ? 'right' : 'left' },
  buttonContainer: { marginTop: 25, flexDirection: 'column', width: '100%' },
  button: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, marginBottom: 10, elevation: 2 },
  callButton: { backgroundColor: '#28a745' }, // Vert pour le téléphone
  whatsappButton: { backgroundColor: '#25D366' }, // Vert WhatsApp
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default WorkerDetailScreen;