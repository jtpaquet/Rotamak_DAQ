from django.apps import AppConfig
import os

class FrontendConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'frontend'

    def ready(self):
        if os.environ.get('RUN_MAIN') == 'true':  # Avoid double init with autoreload
            from daq_python.controller_manager import get_controller
            get_controller()
