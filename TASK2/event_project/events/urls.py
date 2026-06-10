from django.urls import path
from . import views

urlpatterns = [
    path('', views.event_list, name='event_list'),
    path('event/<int:event_id>/', views.event_detail, name='event_detail'),
    path('event/<int:event_id>/register/', views.register, name='register'),
    path('cancel/<int:registration_id>/', views.cancel_registration, name='cancel_registration'),
    path('my-registrations/', views.my_registrations, name='my_registrations'),
    path('signup/', views.signup, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('create-event/', views.create_event, name='create_event'),
]