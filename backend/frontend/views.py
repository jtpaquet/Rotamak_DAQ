import json
from pathlib import Path
import pandas as pd
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings

from rest_framework.decorators import api_view
from rest_framework.response import Response

from daq_python.graph import plot_data
from daq_python.controller_manager import controller
from frontend.models import PreFire, PlasmaDischarge

def index(request):
    return render(request, 'index.html')


@api_view(['POST'])
def start_dischage(request):
    print('START DISCHARGE')
    data = request.data
    try:
        last = PlasmaDischarge.objects.last()
        next_number = 1 if last is None else last.number + 1
        entry = PlasmaDischarge.objects.create(
            number=data.get("number", next_number),     # or however you want to generate this
            parameters=data                             # you can store the full data payload
        )
        print(f"📌 PreFire entry created with ID {entry.id}")
        controller.start_discharge(data)
        return JsonResponse({'status': 'ok'})
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)

@api_view(['POST'])
def start_pre_fire(request):
    print('START PRE FIRE')
    data = request.data
    try:
        
        last = PreFire.objects.last()
        next_number = 1 if last is None else last.number + 1
        entry = PreFire.objects.create(
            number=data.get("number", next_number),     # or however you want to generate this
            parameters=data                             # you can store the full data payload
        )
        print(f"📌 PreFire entry created with ID {entry.id}")

        controller.start_pre_fire(data)
        return JsonResponse({'status': 'ok'})
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)

# Data acquisition
@api_view(['POST'])
def start_data_acquisition(request):
    print(request.data)
    try:
        controller.load_config()  # Load updated config (if needed)
        print("[DAQ] Starting data acquisition...")
        data = controller.start_recording()
        return Response({
            "success": True,
            "data": data,
            "message": "Data acquisition completed successfully"
        })
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=500)


# Graphs
@api_view(['GET'])
def graph_json_view(request, graphId):
    sample_data_path = settings.BASE_DIR / 'daq_python' / 'sample_data.csv'
    df = pd.read_csv(sample_data_path)
    graph_data = {'x':df['t'].to_numpy(), 'y1':df['y1'].to_numpy(), 'y2':df['y2'].to_numpy(),
                  'x_axis_label': 'Time (ms)', 'y_axis_label':'Voltage (mV)', 'title':'DC field',
                   'x_axis_lim': (0,100), 'y_axis_lim': (0, 300),
                   'y1_name': 'Hall sensor (raw)', 'y2_name':'Hall sensor (LP)'}
    
    fig_dict = plot_data(graph_data)

    return JsonResponse(fig_dict)


# The frontend (client) is POSTING the data, the backend (django) receives the data
@api_view(['POST'])
def receive_controls(request):
    data = request.data  # automatically parses json
    control_config_path = settings.BASE_DIR / 'config' / 'daq_controls.json'
    try:
        with open(control_config_path, 'w') as f:
            json.dump(data, f, indent=2)
        controller.update_parameters()
        print(control_config_path)
        return JsonResponse({"success": True, "message": "Configuration saved successfully"})
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except PermissionError:
        return JsonResponse({"error": "Permission denied to write configuration"}, status=403)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['POST'])
def get_pxi_config(request):
    try:
        config = controller.get_pxi_default_config()  # implement this
        print("Views.py: get_pxi_config")
        print(config)
        return JsonResponse(config, safe=False)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['POST'])
def acquire_data(request, deviceName):
    print(deviceName)
    if deviceName == 'PXI':
        try:
            data = request.data  # automatically parses json
            controller.acquire_PXI_data(data)
            return JsonResponse({"success": True, "message": "Configuration saved successfully"})
        except Exception as e:
            import traceback
            print("Exception in acquire_data_view:")
            traceback.print_exc() 
            return JsonResponse({"error": str(e)}, status=500)
    else:
        try:
            data = request.data  # automatically parses json
            controller.acquire_data(data)
            return JsonResponse({"success": True, "message": "Configuration saved successfully"})
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        except PermissionError:
            return JsonResponse({"error": "Permission denied to write configuration"}, status=403)
        except Exception as e:
            import traceback
            print("Exception in acquire_data_view:")
            traceback.print_exc() 
            return JsonResponse({"error": str(e)}, status=500)

# The frontend (client) is POSTING the data, the backend (django) receives the data
@api_view(['POST'])
def receive_settings(request):
    data = request.data  # automatically parses json
    user_config_path = settings.BASE_DIR / 'config' / 'default_settings.json'
    try:
        with open(user_config_path, 'w') as f:
            json.dump(data, f, indent=2)
        return JsonResponse({"success": True, "message": "Configuration saved successfully"})
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except PermissionError:
        return JsonResponse({"error": "Permission denied to write configuration"}, status=403)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# The frontend (client) is GETTING the data, the backend (django) sends the data
@api_view(['GET'])
def send_settings(request, filename):
    print(f"Received GET request for: {filename}")

    if filename not in ['default_settings', 'user_settings']:
        return JsonResponse({'error': 'Invalid settings file'}, status=400)

    config_path = settings.BASE_DIR / 'config' / f'{filename}.json'

    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        config = {}
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format'}, status=500)
    return JsonResponse(config)
