from django.contrib import admin
from .models import PlasmaDischarge, PreFire

class PlasmaDischargeAdmin(admin.ModelAdmin):
    list_display = ('number', 'created_at')
    readonly_fields = ('created_at', 'pretty_parameters')  # mark non-editable fields as read-only
    fieldsets = (
        (None, {
            'fields': ('number', 'created_at', 'pretty_parameters')  # include read-only fields here
        }),
    )

admin.site.register(PlasmaDischarge, PlasmaDischargeAdmin)
admin.site.register(PreFire, PlasmaDischargeAdmin)
