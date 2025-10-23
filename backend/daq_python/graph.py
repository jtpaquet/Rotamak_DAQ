import plotly.graph_objs as go
import numpy as np



def plot_data(graph_data: dict):
    validated = validate_and_prepare_graph_data(graph_data)

    trace1 = go.Scatter(
        x=validated["x"],
        y=validated["y1"],
        mode="lines",
        name=validated["y1_name"],
        line=dict(color="#636EFA"),
    )

    trace2 = go.Scatter(
        x=validated["x"],
        y=validated["y2"],
        mode="lines",
        name=validated["y2_name"],
        line=dict(color="#EF553B"),
    )

    text_color = "#adadad"
    layout = go.Layout(
        title=dict(text=validated["title"], font=dict(color=text_color), x=0.5),
        xaxis=dict(title=validated["x_axis_label"], range=validated["x_axis_lim"],
                   color=text_color, linecolor=text_color, showgrid=False),
        yaxis=dict(title=validated["y_axis_label"], range=validated["y_axis_lim"],
                   color=text_color, linecolor=text_color, showgrid=False),
        legend=dict(x=1.0, y=1.0, xanchor='right', yanchor='top', font=dict(color=text_color)),
    )

    fig = go.Figure(data=[trace1, trace2], layout=layout)
    return fig.to_dict()


# graph_Data should have the following structure
# graph_data = {x:np.array, y1:np.array, y2:np.array, x_axis_label:str, y_axis_label:str, title:str, x_axis_lim: tuple, y_axis_lim: tuple, y1_name: str, y2_name:str}
def validate_and_prepare_graph_data(graph_data: dict) -> dict:
    # 1. Default values
    defaults = {
        "x": np.array([]),
        "y1": np.array([]),
        "y2": np.array([]),
        "x_axis_label": "X Axis",
        "y_axis_label": "Y Axis",
        "title": "My Graph",
        "x_axis_lim": (0, 1),
        "y_axis_lim": (0, 1),
        "y1_name": "Series 1",
        "y2_name": "Series 2",
    }

    # 2. Fill in missing keys with defaults
    for key, default_value in defaults.items():
        if key not in graph_data:
            graph_data[key] = default_value

    # 3. Validate numpy arrays
    for key in ["x", "y1", "y2"]:
        if not isinstance(graph_data[key], np.ndarray):
            raise TypeError(f"{key} must be a numpy.ndarray, got {type(graph_data[key])}.")

    # 4. Check array lengths match
    length = len(graph_data["x"])
    if not (len(graph_data["y1"]) == length and len(graph_data["y2"]) == length):
        raise ValueError("x, y1, and y2 must have the same length.")

    # 5. Validate string fields
    for key in ["x_axis_label", "y_axis_label", "title", "y1_name", "y2_name"]:
        if not isinstance(graph_data[key], str):
            raise TypeError(f"{key} must be a string, got {type(graph_data[key])}.")

    # 6. Validate axis limits
    for key in ["x_axis_lim", "y_axis_lim"]:
        val = graph_data[key]
        if not (isinstance(val, tuple) and len(val) == 2):
            raise TypeError(f"{key} must be a tuple of 2 numbers.")
        if not all(isinstance(v, (int, float)) for v in val):
            raise ValueError(f"Both elements of {key} must be numbers.")

    return graph_data
