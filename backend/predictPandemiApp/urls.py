from django.urls import path
from . import views

urlpatterns = [
    path('login', views.login_view),
    path('logout', views.logout_view),
    path('register', views.register_view),
    path('checker_symptoms', views.checker_symptoms_view),
    path('getTodayCovidData', views.get_today_covid_data_view),
    path('getCols', views.get_cols_from_s3)
]
