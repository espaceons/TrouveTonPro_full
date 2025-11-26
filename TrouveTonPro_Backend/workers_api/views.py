# workers_api/views.py

from rest_framework import viewsets, generics 
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend 
from rest_framework.response import Response # 🚨 CORRECTION : Import manquant pour la méthode list()

from .models import Worker
# Assurez-vous que le WorkerSerializer est correctement importé
from .serializers import WorkerSerializer 
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
    # 🚨 CORRECTION : On retire 'is_active' car le filtre est appliqué par défaut dans get_queryset.
    filterset_fields = ['category'] 
    
    # 🚨 CORRECTION MAJEURE : Enforcer is_active=True pour TOUTES les requêtes
    def get_queryset(self):
        # Retourne UNIQUEMENT les travailleurs dont is_active est True
        return Worker.objects.filter(is_active=True)
    
    # Surcharge de la méthode LIST pour gérer le filtrage et le tri personnalisés
    def list(self, request, *args, **kwargs):
        
        # 1. Appliquer le filtrage DRF (DjangoFilterBackend) sur le QuerySet.
        # Le QuerySet retourné par get_queryset() est déjà filtré par is_active=True.
        # Ici, seul le filtre par 'category' sera appliqué.
        filtered_queryset = self.filter_queryset(self.get_queryset())
        
        # Récupérer les Query Params
        ordering = request.query_params.get('ordering')
        user_lat = request.query_params.get('user_lat')
        user_lng = request.query_params.get('user_lng')

        workers_to_serialize = filtered_queryset # Par défaut, on utilise le QuerySet filtré
        
        # 2. Traitement du tri par distance (appliqué uniquement sur le QuerySet déjà filtré)
        if ordering == 'distance' and user_lat and user_lng:
            
            try:
                user_lat = float(user_lat)
                user_lng = float(user_lng)
            except ValueError:
                # Si les coordonnées sont invalides, on continue avec la liste filtrée non triée
                pass 
            else:
                workers_with_distance = []
                
                # Le tri Haversine est appliqué sur le QuerySet déjà filtré et actif
                for worker in filtered_queryset: 
                    if worker.latitude and worker.longitude: 
                        
                        distance = calculate_haversine_distance(
                            user_lat, 
                            user_lng, 
                            float(worker.latitude), 
                            float(worker.longitude)
                        )
                        # Assigner la distance pour la sérialisation future (si WorkerSerializer le supporte)
                        worker.distance = distance 
                        workers_with_distance.append((distance, worker))
                
                # Trie les travailleurs du plus proche au plus éloigné
                workers_with_distance.sort(key=lambda x: x[0])
                
                # Remplace le QuerySet par la liste Python triée
                workers_to_serialize = [worker for distance, worker in workers_with_distance]


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