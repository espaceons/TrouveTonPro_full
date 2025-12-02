# workers_api/admin.py
from django.contrib import admin
from .models import Advertisement, Worker

class WorkerAdmin(admin.ModelAdmin):
    
    # 1. Configuration de la Vue Liste (Tableau)
    # ----------------------------------------
    list_display = (
        'id', 
        'first_name', 
        'last_name', 
        'category', 
        'city', 
        'phone', 
        'rating',         # Champ rating ajouté
        'is_active',
        'created_at',     # Champ de suivi créé (lecture seule)
        'updated_at',     # Champ de suivi modifié (lecture seule)
    )
    
    # NOTE IMPORTANTE : Les champs dans list_editable NE DOIVENT PAS être dans list_display_links.
    # Nous utilisons 'first_name', 'last_name' pour le lien, donc 'city' et 'category' doivent être retirés de list_editable.
    list_display_links = ('id', 'first_name', 'last_name')
    
    # Filtres latéraux (sidebar)
    list_filter = ('category', 'city', 'is_active', 'created_at') 
    
    # Recherche rapide par nom, prénom, téléphone et ville
    search_fields = ('first_name', 'last_name', 'city', 'phone')
    
    # Tri par défaut (Afficher les actifs en premier)
    ordering = ('-is_active', 'last_name', 'first_name')
    
    # Rendre SEULEMENT is_active éditable directement dans la liste (pour éviter le conflit)
    list_editable = ('is_active', 'rating')
    
    # 2. Configuration du Formulaire d'Édition
    # ---------------------------------------
    # Les champs 'created_at' et 'updated_at' doivent être en lecture seule.
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Statut et Identité du Travailleur', {
            'fields': ('is_active', 'first_name', 'last_name', 'image', 'rating'), # Ajout de rating ici
        }),
        ('Coordonnées et Description', {
            'fields': ('phone', 'whatsapp_number', 'bio'),
        }),
        ('Détails Professionnels et Localisation', {
            'fields': ('category', 'city', 'latitude', 'longitude'), 
            'description': "Coordonnées requises pour le tri par proximité.",
        }),
        ('Historique (Lecture Seule)', {
            # Affichage des champs de suivi
            'fields': ('created_at', 'updated_at'), 
        }),
    )

admin.site.register(Worker, WorkerAdmin)


class AdvertisementAdmin(admin.ModelAdmin):
    list_display = (
        'title', 
        'store_name', 
        'priority', 
        'category_target', 
        'is_active', 
        'start_date', # 🚨 AJOUT
        'end_date',   # 🚨 AJOUT
        'created_at'
    )
    list_filter = ('is_active', 'category_target', 'city_target', 'start_date', 'end_date') # 🚨 AJOUT
    search_fields = ('title', 'store_name')
    list_editable = ('is_active', 'priority', 'start_date', 'end_date') # 🚨 AJOUT

admin.site.register(Advertisement, AdvertisementAdmin)