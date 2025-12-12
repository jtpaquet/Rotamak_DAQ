import json
from django.db import models
from django.utils.safestring import mark_safe

class PreFire(models.Model):
    number = models.IntegerField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    parameters = models.JSONField()

    def __str__(self):
        return f'Pre-fire # {self.number}'

    def pretty_parameters(self):
        """Return JSON as pretty-printed HTML for admin."""
        try:
            pretty_json = json.dumps(self.parameters, indent=4)
            # Wrap in <pre> for fixed-width formatting
            return mark_safe(f'<pre style="white-space: pre-wrap;">{pretty_json}</pre>')
        except Exception:
            return str(self.parameters)
    
    pretty_parameters.short_description = "Parameters"

class PlasmaDischarge(models.Model):
    number = models.IntegerField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    parameters = models.JSONField()

    def __str__(self):
        return f'Discharge # {self.number}'

    def pretty_parameters(self):
        """Return JSON as pretty-printed HTML for admin."""
        try:
            pretty_json = json.dumps(self.parameters, indent=4)
            # Wrap in <pre> for fixed-width formatting
            return mark_safe(f'<pre style="white-space: pre-wrap;">{pretty_json}</pre>')
        except Exception:
            return str(self.parameters)
    
    pretty_parameters.short_description = "Parameters"

    def __str__(self):
        return f'Discharge # {self.number}'
