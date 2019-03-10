from django.contrib import admin
from django.urls import path
from meet.views import mapview, chartview

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', mapview),
    path('map/', mapview),
    path('chart/<int:series>/', chartview)
]
