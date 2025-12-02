# workers_api/urls.py

from django.urls import path
from .views import AdvertisementList, WorkerList, WorkerDetail

urlpatterns = [
    # 🚨 1. PUBLICITÉS EN PREMIER :
    path('advertisements/', AdvertisementList.as_view(), name='advertisement-list'),
    
    # 2. RÈGLE DYNAMIQUE APRÈS :
    path('<str:id>/', WorkerDetail.as_view(), name='worker-detail'), 
    
    # 3. RÈGLE RACINE :
    path('', WorkerList.as_view(), name='worker-list'), 
]