# workers_api/views.py

from rest_framework import viewsets, generics 
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend 
from rest_framework.response import Response 
from django.utils import timezone # IMPORT pour obtenir la date du jour
from rest_framework import generics
from .models import Advertisement, Worker


# Assurez-vous que le WorkerSerializer est correctement importé
from .serializers import AdvertisementSerializer, WorkerSerializer 
from math import radians, sin, cos, sqrt, atan2


# Constante pour le rayon de la Terre en kilomètres
R = 6371.0

# Fonction utilitaire pour calculer la distance Haversine
def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    dlon = lon2 - lon1
    dlat = lat2 - lat1

    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    distance = R * c
    return distance


class WorkerRetrieveListViewSet(viewsets.ReadOnlyModelViewSet):
    
    serializer_class = WorkerSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter] 
    filterset_fields = ['category'] 
    
    def get_queryset(self):
        return Worker.objects.filter(is_active=True)
    
    # Surcharge de la méthode LIST pour gérer le tri par distance (Haversine)
    # Surcharge de la méthode LIST pour gérer le filtrage et le tri personnalisés
    def list(self, request, *args, **kwargs):
        
        filtered_queryset = self.filter_queryset(self.get_queryset())
        
        ordering = request.query_params.get('ordering')
        user_lat = request.query_params.get('user_lat')
        user_lng = request.query_params.get('user_lng')

        workers_to_serialize = []
        
        # 1. Traitement du tri par distance (appliqué uniquement sur le QuerySet déjà filtré)
        if ordering == 'distance' and user_lat and user_lng:
            
            try:
                # Coordonnées de l'utilisateur
                user_lat = float(user_lat)
                user_lng = float(user_lng)
            except ValueError:
                # Si les coordonnées de l'utilisateur sont invalides
                workers_to_serialize = filtered_queryset 
                print("Coordonnées utilisateur invalides.")
            else:
                workers_with_distance = []
                
                # Le tri Haversine est appliqué sur le QuerySet déjà filtré et actif
                for worker in filtered_queryset: 
                    # 🚨 VÉRIFICATION SÉCURISÉE DES COORDONNÉES DU TRAVAILLEUR
                    if worker.latitude is not None and worker.longitude is not None: 
                        
                        try:
                            # 🚨 CONVERSION OBLIGATOIRE EN FLOAT pour la fonction mathématique
                            worker_lat = float(worker.latitude)
                            worker_lng = float(worker.longitude)
                            
                            distance = calculate_haversine_distance(
                                user_lat, 
                                user_lng, 
                                worker_lat, 
                                worker_lng
                            )
                            
                            if isinstance(distance, (int, float)):
                                # Assigner la distance pour la sérialisation
                                worker.distance = distance 
                                workers_with_distance.append((distance, worker))
                            
                        except (TypeError, ValueError) as e:
                            # Si le DecimalField est corrompu dans la BD
                            print(f"Erreur de conversion des coordonnées du travailleur {worker.id}: {e}")
                            pass
                
                # Trie les travailleurs du plus proche au plus éloigné
                workers_with_distance.sort(key=lambda x: x[0])
                
                # Remplace le QuerySet par la liste Python triée
                workers_to_serialize = [worker for distance, worker in workers_with_distance]
        
        # 2. Tri par Nom ou Ville (via Django ORM)
        elif ordering in ['first_name', 'last_name', 'city']:
            workers_to_serialize = filtered_queryset.order_by(ordering)
            
        # 3. Aucun tri particulier
        else:
            workers_to_serialize = filtered_queryset


        # 3. Sérialisation et réponse
        serializer = self.get_serializer(workers_to_serialize, many=True)
        return Response(serializer.data)
    
# Vue pour lister tous les travailleurs (GET) et en créer de nouveaux (POST)
class WorkerList(generics.ListCreateAPIView):
    # 🚨 CORRECTION : S'assurer que cette vue aussi n'affiche que les actifs
    queryset = Worker.objects.filter(is_active=True)
    serializer_class = WorkerSerializer

# Vue pour récupérer un travailleur spécifique (GET)
class WorkerDetail(generics.RetrieveAPIView):
    # La vue Retrieve peut potentiellement montrer un travailleur inactif si l'on connaît l'ID,
    # mais pour l'affichage public, vous pouvez aussi le filtrer. 
    # Je vais laisser le queryset par défaut ou le filtrer si vous ne voulez pas exposer les inactifs.
    # Dans le doute, on filtre aussi ici pour la cohérence.
    queryset = Worker.objects.filter(is_active=True)
    serializer_class = WorkerSerializer
    lookup_field = 'id'


# Vue pour lister les publicités
class AdvertisementList(generics.ListAPIView):
    serializer_class = AdvertisementSerializer
    
    # On utilise get_queryset() pour appliquer le filtre temporel dynamique
    def get_queryset(self):
        # 1. Récupérer la date du jour (sans l'heure)
        today = timezone.now().date()
        
        # 2. Filtrer les publicités
        return Advertisement.objects.filter(
            # Le statut général doit être ACTIF
            is_active=True,
            
            # 🚨 NOUVEAU FILTRE : La date de début doit être aujourd'hui ou dans le passé
            start_date__lte=today,
            
            # 🚨 NOUVEAU FILTRE : La date de fin doit être aujourd'hui ou dans le futur
            end_date__gte=today
            
        ).order_by('-priority') # Tri par priorité

    # Les filtres DjangoFilterBackend restent les mêmes pour le ciblage (category_target, city_target)
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category_target', 'city_target']