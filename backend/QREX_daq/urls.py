"""
URL configuration for QREX_daq project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from frontend.views import index, receive_controls, receive_settings, send_settings, graph_json_view, start_data_acquisition, acquire_data, start_dischage, get_pxi_config

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/config/save', receive_settings, name='receive_settings'),
    path('api/daq-control', receive_controls, name='receive_controls'),
    path('api/daq-discharge', start_dischage, name='start_dischage'),
    path('api/daq/<str:deviceName>', acquire_data, name='acquire_data'),
    path('api/daq-config', get_pxi_config, name='get_pxi_config'),
    path('api/graph-json/<str:graphId>', graph_json_view, name='graph_json_view'), # graphId is a string parameter passed along the url
    path('config/<str:filename>.json', send_settings, name='send_settings'), # Filename is a string parameter passed along the url
    path('api/start-recording/', start_data_acquisition, name='start-recording'),
    path('', index),
]

if settings.DEBUG:
    urlpatterns += static('/assets/', document_root=settings.STATICFILES_DIRS[0] / 'assets')
