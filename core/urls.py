from django.contrib import admin
from django.urls import path, include 
from core.views import index, projects  # Updated import

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # This line tells Django to look at your core/urls.py file for all other URLs
    path('', include('core.urls')), 
]