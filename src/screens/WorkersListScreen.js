import * as Location from 'expo-location';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  I18nManager,
  ActivityIndicator,
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Feather } from '@expo/vector-icons'; 

// --- CONFIGURATION API ---
// ⚠️ ASSUREZ-VOUS QUE CETTE IP EST CORRECTE ET ACCESSIBLE DEPUIS VOTRE ÉMULATEUR/TÉLÉPHONE
const IP = 'http://172.16.172.70:8000'; 
const API_URL = `${IP}/api/workers/`; 
const API_TIMEOUT = 5000; // 5 secondes
// -------------------------

// --- Mapped Component (WorkerItem) ---
const WorkerItem = ({ worker, navigation }) => {
  const imageUrl = worker.image;

  return (
    <TouchableOpacity 
      style={styles.itemContainer} 
      onPress={() => 
        navigation.navigate('WorkerDetail', { workerId: worker.id, workerName: `${worker.first_name} ${worker.last_name}` })
      }
    >
      <View style={styles.headerContainer}>
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.workerImage} 
        /> 
        
        <View style={{ flex: 1 }}> 
          <Text style={styles.category}>{worker.category}</Text>
          <Text style={styles.name}>{worker.first_name} {worker.last_name}</Text>
          {/* AFFICHAGE DE LA DISTANCE (si fournie par l'API) */}
          {worker.distance && (
            <Text style={styles.distanceText}>
              {`يبعد ${worker.distance.toFixed(1)} كم`}
            </Text>
          )}
        </View>
      </View>
      
      <Text style={styles.detail}>المدينة: {worker.city}</Text>
      <Text style={styles.tapToView}>اضغط لرؤية التفاصيل والتواصل </Text>
    </TouchableOpacity>
  );
};

// --- Main Screen Component ---
const WorkersListScreen = ({ navigation }) => {
  const [workers, setWorkers] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortCriteria, setSortCriteria] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null); 
  const [locationErrorMsg, setLocationErrorMsg] = useState(null);


  // 1. FONCTION DE RÉCUPÉRATION DES DONNÉES ET DE FILTRAGE/TRI (SERVEUR)
  const fetchWorkers = async () => {
    setIsLoading(true);
    let API_URL_FILTRED = `${API_URL}?`;
    let params = [];
    
    // ✅ FILTRE ESSENTIEL : N'afficher QUE les travailleurs actifs
    params.push(`is_active=True`);
    
    // --- 1. Filtre de catégorie ---
    if (selectedCategory && selectedCategory !== 'all') {
      params.push(`category=${selectedCategory}`);
    }
    
    // --- 2. Tri par distance (si userLocation est disponible) ---
    if (sortCriteria === 'distance' && userLocation) {
      params.push(`ordering=distance`);
      params.push(`user_lat=${userLocation.latitude}`);
      params.push(`user_lng=${userLocation.longitude}`);
    } 
    // --- 3. Tri Nom/Ville (si géré côté serveur) ---
    else if (sortCriteria === 'name') {
        params.push(`ordering=first_name`);
    } else if (sortCriteria === 'city') {
        params.push(`ordering=city`);
    }


    API_URL_FILTRED += params.join('&');

    // Gestion du Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT); 

    try {
      const response = await fetch(API_URL_FILTRED, { signal: controller.signal });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      setWorkers(data); 
      setError(null);
    } catch (err) {
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
          setError(`Timeout : Impossible de joindre le serveur Django (${IP}) après ${API_TIMEOUT / 1000}s.`);
      } else {
          console.error("Erreur de l'API Django:", err);
          setError(`Impossible de charger les données. Vérifiez l'IP ou le serveur Django. (Détail: ${err.message})`);
      }
    } finally {
      setIsLoading(false);
    }
  };
    
  // 2. RÉCUPÉRATION DE LA LOCALISATION DE L'UTILISATEUR
  const fetchUserLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationErrorMsg('Permission d\'accès à la localisation refusée.');
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLocationErrorMsg(null);
    } catch (error) {
      setLocationErrorMsg("Impossible d'obtenir la localisation actuelle.");
    }
  };
    
  // 3. HOOKS DE VIE ET MISE À JOUR AUTOMATIQUE
  
  // Récupère la localisation au premier montage de l'écran
  useEffect(() => {
    fetchUserLocation();
  }, []);

  // useFocusEffect pour recharger les données lorsque l'écran est mis au point (focus)
  useFocusEffect(
    useCallback(() => {
      // Déclenche fetchWorkers si les critères de filtre/tri changent
      if (sortCriteria !== 'distance' || userLocation) {
        fetchWorkers();
      }
    }, [selectedCategory, sortCriteria, userLocation])
  );

  // 4. LOGIQUE DE FILTRAGE ET TRI CÔTÉ CLIENT (Recherche et Fallback de Catégorie)
  
  const allCategories = useMemo(() => {
    if (!workers.length) return ['كل الفئات'];
    // Crée une liste unique des catégories, en ajoutant l'option 'كل الفئات'
    return ['كل الفئات', ...new Set(workers.map(w => w.category))]; 
  }, [workers]);
  
  const sortedAndFilteredWorkers = useMemo(() => {
    let list = workers.filter(worker => {
      // 1. Filtre de recherche
      const lowerCaseSearch = searchTerm.toLowerCase();
      const workerInfo = 
        `${worker.first_name} ${worker.last_name} ${worker.category} ${worker.city}`.toLowerCase();
      const matchesSearch = workerInfo.includes(lowerCaseSearch);

      // 2. Filtre de catégorie (Fallback : au cas où l'API ne filtre pas parfaitement)
      const matchesCategory = selectedCategory === 'all' || worker.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    // Tri Côté Client (Uniquement si l'API ne le gère pas ou si la liste est déjà filtrée)
    // Nous laissons l'API gérer le tri si possible, mais ce code est un filet de sécurité.
    if (sortCriteria === 'name' || sortCriteria === 'city') {
        list.sort((a, b) => {
            let valA = sortCriteria === 'name' ? a.last_name : a.city;
            let valB = sortCriteria === 'name' ? b.last_name : b.city;
            return valA.localeCompare(valB, 'ar'); // Tri adapté à l'arabe
        });
    }

    return list;
  }, [workers, searchTerm, selectedCategory, sortCriteria]);

  // 5. GESTION DES ACTIONS UTILISATEUR
  
  const handleCategoryChange = (item) => {
    const newCategory = item === 'كل الفئات' ? 'all' : item; 
    setSelectedCategory(newCategory);
    setSearchTerm(''); 
  };
  
  const handleSortChange = (criteria) => {
      setSortCriteria(criteria); 
  };

  // RENDU CONDITIONNEL (Chargement, Erreur)
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>جاري التحميل... ⏳</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <Text style={styles.subErrorText}>Veuillez vérifier votre adresse IP et le serveur Django.</Text>
        {locationErrorMsg && <Text style={styles.subErrorText}>Localisation: {locationErrorMsg}</Text>}
        <TouchableOpacity style={styles.retryButton} onPress={fetchWorkers}>
          <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}> 
      <Text style={styles.header}>دليل المهنيين 🛠️</Text>

      {/* Champ de Recherche */}
      <TextInput
        style={[styles.searchInput, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}
        placeholder="ابحث بالاسم، المدينة، المهنة..."
        value={searchTerm}
        onChangeText={setSearchTerm} 
      />

      {/* 1. Filtre par Catégorie (Barre de boutons) */}
      <View style={styles.filterBarContainer}>
        <Text style={styles.filterLabel}>تصفية:</Text>
        <FlatList
          data={allCategories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item}
          renderItem={({ item }) => {
            const isActive = selectedCategory === (item === 'كل الفئات' ? 'all' : item);
            return (
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  isActive && styles.categoryButtonActive,
                ]}
                onPress={() => handleCategoryChange(item)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  isActive && styles.categoryButtonTextActive,
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
      
      {/* 2. Boutons de Tri */}
      <View style={styles.filterBarContainer}>
        <Text style={styles.filterLabel}>فرز حسب:</Text>
        
        {/* Tri par Nom */}
        <TouchableOpacity
          style={[styles.sortButton, sortCriteria === 'name' && styles.sortButtonActive]}
          onPress={() => handleSortChange('name')}
        >
          <Text style={[styles.sortButtonText, sortCriteria === 'name' && styles.sortButtonTextActive]}>الاسم</Text>
        </TouchableOpacity>

        {/* Tri par Ville */}
        <TouchableOpacity
          style={[styles.sortButton, sortCriteria === 'city' && styles.sortButtonActive]}
          onPress={() => handleSortChange('city')}
        >
          <Text style={[styles.sortButtonText, sortCriteria === 'city' && styles.sortButtonTextActive]}>المدينة</Text>
        </TouchableOpacity>

        {/* Tri par Distance (S'affiche si la localisation n'est pas refusée) */}
        {userLocation && (
            <TouchableOpacity
                style={[styles.sortButton, sortCriteria === 'distance' && styles.sortButtonActive]}
                onPress={() => handleSortChange('distance')}
            >
                <Feather 
                    name="map-pin" 
                    size={14} 
                    color={sortCriteria === 'distance' ? 'white' : '#666'} 
                    style={{ marginRight: 4 }} 
                />
                <Text style={[styles.sortButtonText, sortCriteria === 'distance' && styles.sortButtonTextActive]}>الأقرب</Text>
            </TouchableOpacity>
        )}
      </View>


      {/* Liste des Professionnels */}
      <FlatList
        data={sortedAndFilteredWorkers} 
        renderItem={({ item }) => <WorkerItem worker={item} navigation={navigation} />} 
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={() => (
          <Text style={styles.emptyMessage}>
            لم يتم العثور على أي مهنيين يتطابقون مع المعايير.
          </Text>
        )}
      />
    </SafeAreaView>
  );
};

// --- Styles pour WorkersListScreen ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
  loadingText: { fontSize: 20, color: '#007AFF', fontWeight: 'bold', marginTop: 10 },
  errorText: { fontSize: 18, color: 'red', fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 20 },
  subErrorText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 10, paddingHorizontal: 20 },
  retryButton: { backgroundColor: '#FF6347', padding: 10, borderRadius: 5, marginTop: 20 },
  retryButtonText: { color: 'white', fontWeight: 'bold' },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 5, marginBottom: 10, color: '#333' },
  searchInput: { height: 40, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginHorizontal: 16, marginBottom: 15, backgroundColor: '#fff', textAlign: I18nManager.isRTL ? 'right' : 'left' },
  itemContainer: { backgroundColor: '#fff', padding: 15, marginVertical: 8, marginHorizontal: 16, borderRadius: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  headerContainer: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 5 },
  workerImage: { 
    width: 50,
    height: 50,
    borderRadius: 25, 
    marginRight: I18nManager.isRTL ? 0 : 10,
    marginLeft: I18nManager.isRTL ? 10 : 0,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  category: { fontSize: 18, fontWeight: 'bold', color: '#007AFF', textAlign: I18nManager.isRTL ? 'right' : 'left' },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 0, textAlign: I18nManager.isRTL ? 'right' : 'left' },
  detail: { fontSize: 14, color: '#666', marginTop: 5, textAlign: I18nManager.isRTL ? 'right' : 'left' },
  distanceText: { fontSize: 14, color: '#007AFF', marginTop: 2, textAlign: I18nManager.isRTL ? 'right' : 'left' }, 
  tapToView: { fontSize: 12, color: '#007AFF', marginTop: 10, fontStyle: 'italic', textAlign: I18nManager.isRTL ? 'left' : 'right' },
  emptyMessage: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
  filterBarContainer: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  filterLabel: { fontSize: 14, fontWeight: 'bold', color: '#666', marginRight: I18nManager.isRTL ? 0 : 10, marginLeft: I18nManager.isRTL ? 10 : 0, flexShrink: 0, textAlign: 'right' },
  categoryButton: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: I18nManager.isRTL ? 0 : 8, marginLeft: I18nManager.isRTL ? 8 : 0, borderWidth: 1, borderColor: '#ccc' },
  categoryButtonActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  categoryButtonText: { fontSize: 14, color: '#333', textAlign: 'center' },
  categoryButtonTextActive: { color: 'white' },
  sortButton: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 5, 
    marginRight: I18nManager.isRTL ? 0 : 8, 
    marginLeft: I18nManager.isRTL ? 8 : 0, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  sortButtonActive: { backgroundColor: '#6C757D', borderColor: '#6C757D' },
  sortButtonText: { fontSize: 14, color: '#333', textAlign: 'center' },
  sortButtonTextActive: { color: 'white', fontWeight: 'bold' }
});

export default WorkersListScreen;