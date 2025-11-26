# workers_api/urls.py
from django.urls import path
from .views import WorkerList, WorkerDetail

urlpatterns = [
    path('', WorkerList.as_view(), name='worker-list'), # /api/workers/
    path('<str:id>/', WorkerDetail.as_view(), name='worker-detail'), # /api/workers/w1/
]