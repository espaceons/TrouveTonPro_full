# workers_api/models.py

from django.db import models


# DEFAULT_IP = 'http://172.16.172.70:8000'
# DEFAULT_IMAGE_URL = DEFAULT_IP +'/static/images/personne.jpg'


class Worker(models.Model):
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    
    # rating : max_digits=2 permet d'aller jusqu'à 9.9
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=0.0) 
    
    phone = models.CharField(max_length=15)
    whatsapp_number = models.CharField(max_length=15, blank=True, null=True)
    bio = models.TextField()
    
    # 🚨 CORRECTION 2 : Si vous utilisez des URL (chemin statique complet), utilisez URLField
    # Sinon, si vous gérez des fichiers uploadés, utilisez ImageField avec la bonne configuration MEDIA.
    # Dans ce cas, nous laissons ImageField mais sans le chemin par défaut problématique
    image = models.ImageField( 
        upload_to='workers_images/', 
        default='workers_images/personne.jpg', # Ceci nécessite la configuration MEDIA_ROOT
        blank=True, 
        null=True 
    )
    
    # Localisation (pas de changement nécessaire, la précision est bonne)
    latitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True,
        verbose_name="Latitude du lieu de travail"
    )
    longitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True,
        verbose_name="Longitude du lieu de travail"
    )
    is_active = models.BooleanField(default=True, verbose_name="Actif (Visible dans l'App)")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de Création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière Modification")


    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.category})"