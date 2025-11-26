# workers_api/serializers.py
from rest_framework import serializers
from .models import Worker

class WorkerSerializer(serializers.ModelSerializer):
    # Ceci va s'assurer que 'image' renvoie l'URL absolue (http://ip:port/media/...)
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = Worker
        fields = '__all__' # Inclure tous les champs du modèle