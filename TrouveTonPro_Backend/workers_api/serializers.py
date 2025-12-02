# workers_api/serializers.py
from rest_framework import serializers
from .models import Advertisement, Worker

class WorkerSerializer(serializers.ModelSerializer):

    # Ce champ sera rempli dynamiquement par la méthode get_distance
    distance = serializers.SerializerMethodField()


    # Ceci va s'assurer que 'image' renvoie l'URL absolue (http://ip:port/media/...)
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = Worker
        fields = (
            'id', 'first_name', 'last_name', 'category', 'sous_category', 'city', 
            'rating', 'phone', 'whatsapp_number', 'bio', 'image', 
            'latitude', 'longitude', 'is_active', 
            # CLÉ : Inclure 'distance' ici
            'distance' 
        )

    # 🚨 MÉTHODE POUR RÉCUPÉRER L'ATTRIBUT distance
    def get_distance(self, obj):
        # Vérifie si l'attribut 'distance' a été attaché à l'objet par la vue list()
        if hasattr(obj, 'distance'):
            # Retourne la distance calculée (en kilomètres)
            return obj.distance
        # Retourne None si la distance n'a pas été calculée (si pas de tri par distance)
        return None # Renvoie None si la distance n'a pas été calculée dans cette requête


# ----------------------------------------
# Advertisement Serializer
# ----------------------------------------
# workers_api/serializers.py

from rest_framework import serializers
from .models import Advertisement 

class AdvertisementSerializer(serializers.ModelSerializer):
    # 🚨 NOUVEAU CHAMP CALCULÉ : 'image_url' pour le frontend
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Advertisement
        # Assurez-vous d'utiliser 'image' (le nom du champ dans le modèle)
        # et 'image_url' (le champ calculé)
        fields = (
            'id', 'title', 'store_name', 'image_url', 'target_url', 
            'category_target', 'city_target', 'priority', 'is_active', 
            'start_date', 'end_date', 'created_at', 'image' # On garde 'image' pour le CRUD
        )
        read_only_fields = ('image_url',) # Le frontend ne modifie pas cette URL

    def get_image_url(self, obj):
        # Lister les champs d'image que nous voulons inclure
        image_fields = [obj.image, obj.image1, obj.image2, obj.image3]
        
        request = self.context.get('request')
        image_url = []
        
        # Parcourir les champs et générer l'URL absolue si l'image existe
        for img_field in image_fields:
            if img_field and hasattr(img_field, 'url'):
                # Si l'image existe, on construit l'URL absolue (nécessite le 'request' dans le contexte)
                url = request.build_absolute_uri(img_field.url) if request else img_field.url
                image_url.append(url)
                
        return image_url

# Maintenant, la réponse JSON pour chaque publicité contiendra:
# "image_urls": [
#   "http://ip:port/media/advertisement_banners/img1.jpg", 
#   "http://ip:port/media/advertisement_banners/img2.jpg", 
#   ...
# ]