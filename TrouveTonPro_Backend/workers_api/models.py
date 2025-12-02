# workers_api/models.py

from django.db import models


# DEFAULT_IP = 'http://172.16.172.70:8000'
# DEFAULT_IMAGE_URL = DEFAULT_IP +'/static/images/personne.jpg'


class Worker(models.Model):
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    sous_category = models.CharField(max_length=100)
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
        return f"{self.first_name} {self.last_name} ({self.category} {self.sous_category})"
    


# 🚨 NOUVEAU : Modèle pour la Publicité / Boutique Partenaire
class Advertisement(models.Model):
    """
    Modèle pour stocker les publicités de boutiques ou services partenaires.
    Ces publicités seront affichées sur le BusinessScreen de l'application.
    """
    title = models.CharField(max_length=200, verbose_name="Titre de la Publicité")
    store_name = models.CharField(max_length=100, verbose_name="Nom de la Boutique/Service")
    
    # URL de l'image (pour l'affichage du banner dans l'application)
    # image_url = models.URLField(max_length=200, verbose_name="Lien de l'Image du Banner")
    image = models.ImageField(
        upload_to='advertisement_banners/', # Dossier où l'image sera stockée (dans MEDIA_ROOT)
        verbose_name="Image de la Boutique",
        default='boutiques/boutique.png', # Ceci nécessite la configuration MEDIA_ROOT
        blank=True, 
        null=True 
    )
    image1 = models.ImageField(
        upload_to='advertisement_banners/', # Dossier où l'image sera stockée (dans MEDIA_ROOT)
        verbose_name="Image de la Boutique1",
        default='boutiques/boutique.png', # Ceci nécessite la configuration MEDIA_ROOT
        blank=True, 
        null=True 
    )
    image2 = models.ImageField(
        upload_to='advertisement_banners/', # Dossier où l'image sera stockée (dans MEDIA_ROOT)
        verbose_name="Image de la Boutique2",
        default='boutiques/boutique.png', # Ceci nécessite la configuration MEDIA_ROOT
        blank=True, 
        null=True 
    )
    image3 = models.ImageField(
        upload_to='advertisement_banners/', # Dossier où l'image sera stockée (dans MEDIA_ROOT)
        verbose_name="Image de la Boutique3",
        default='boutiques/boutique.png', # Ceci nécessite la configuration MEDIA_ROOT
        blank=True, 
        null=True 
    )
    
    # URL cible lorsque l'utilisateur clique (vers un site web, un numéro de téléphone, etc.)
    target_url = models.URLField(
        max_length=200, 
        blank=True, 
        null=True, 
        verbose_name="Lien Clic (vers site ou téléphone)"
    )

    # Période de publication
    start_date = models.DateField(verbose_name="Date de début de publication")
    end_date = models.DateField(verbose_name="Date de fin de publication")
    
    # --- Critères de Ciblage pour l'Affichage ---
    category_target = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name="Catégorie Ciblée (Ex: Plombier)" # Si la publicité doit apparaître près des Plombiers
    )
    city_target = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name="Ville Ciblée" # Si elle ne doit apparaître que dans une ville spécifique
    )
    
    # État et Priorité
    is_active = models.BooleanField(default=True, verbose_name="Publicité Active")
    priority = models.IntegerField(
        default=1, 
        verbose_name="Priorité d'Affichage (1-10)" # Utilisé pour le tri dans la vue API
    ) 

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Publicité"
        verbose_name_plural = "Publicités"
        # Tri par défaut par priorité décroissante
        ordering = ['-priority', 'store_name'] 

    def __str__(self):
        return f"PUB: {self.title} ({self.store_name})"