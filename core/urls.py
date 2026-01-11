from django.urls import path
from . import views

urlpatterns = [
    # The name='index' here is what the navbar looks for
    path('', views.index, name='index'),
    
    # The name='projects' here is what the navbar looks for
    path('projects/', views.projects, name='projects'),
]