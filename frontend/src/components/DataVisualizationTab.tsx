import { useContext, useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ConfigContext } from "../App";
import Plot from "react-plotly.js";
import { BarChart3, Loader2 } from "lucide-react";

interface PlotlyData {
  x?: number[];
  y?: number[];
  type?: string;
  mode?: string;
  name?: string;
  [key: string]: any;
}

interface PlotlyLayout {
  title?: string;
  xaxis?: { title?: string };
  yaxis?: { title?: string };
  [key: string]: any;
}

interface GraphData {
  data: PlotlyData[];
  layout: PlotlyLayout;
}

interface DataVisualizationTabProps {
  isActive: boolean;
}

export function DataVisualizationTab({ isActive }: DataVisualizationTabProps) {
  const configContext = useContext(ConfigContext);
  const config = configContext?.config;

  const graphsToDisplay = config?.visualization.graphsToDisplay.default ?? 16;
  const numRows = Math.ceil(graphsToDisplay / 2);

  const [graphData, setGraphData] = useState<{ [key: number]: GraphData }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const fetchGraphData = async () => {
    setLoading(true);
    setError(null);
    const newGraphData: { [key: number]: GraphData } = {};

    try {
      // Fetch data for all graphs
      const fetchPromises = Array.from({ length: graphsToDisplay }, (_, i) => {
        const graphId = i + 1;
        return fetch(`/api/graph-json/${graphId}`)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Failed to fetch graph ${graphId}`);
            }
            return response.json();
          })
          .then((data) => {
            newGraphData[graphId] = data;
          })
          .catch((error) => {
            console.error(`Error fetching graph ${graphId}:`, error);
            // Create a placeholder error graph
            newGraphData[graphId] = {
              data: [{
                x: [0, 1, 2, 3, 4],
                y: [0, 0, 0, 0, 0],
                type: 'scatter',
                mode: 'lines',
                name: 'No Data',
              }],
              layout: {
                title: `Graph ${graphId} - Error Loading Data`,
                xaxis: { title: 'X Axis' },
                yaxis: { title: 'Y Axis' },
              },
            };
          });
      });

      await Promise.all(fetchPromises);
      setGraphData(newGraphData);
    } catch (error) {
      console.error("Error fetching graph data:", error);
      setError("Failed to load graph data");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch data when tab becomes active
  useEffect(() => {
    if (isActive && !hasLoadedOnce.current) {
      hasLoadedOnce.current = true;
      fetchGraphData();
    }
  }, [isActive]);

  return (
    <div className="space-y-4">
      {/* Plot Graphs Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2>Data Visualization</h2>
          <p className="text-muted-foreground text-sm">
            Display graphs from DAQ system
          </p>
        </div>
        <Button
          onClick={fetchGraphData}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading Graphs...
            </>
          ) : (
            <>
              <BarChart3 className="h-4 w-4" />
              Plot Graphs
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Graphs Grid */}
      <div className="space-y-3">
        {Array.from({ length: numRows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-2 gap-3">
            {Array.from({ length: 2 }).map((_, colIndex) => {
              const graphNumber = rowIndex * 2 + colIndex + 1;
              if (graphNumber > graphsToDisplay) return null;
              
              const hasData = graphData[graphNumber];

              return (
                <Card key={colIndex}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Graph {graphNumber}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {hasData ? (
                      <div className="w-full">
                        <Plot
                          data={hasData.data}
                          layout={{
                            ...hasData.layout,
                            autosize: true,
                            margin: { l: 50, r: 30, t: 40, b: 40 },
                            paper_bgcolor: 'transparent',
                            plot_bgcolor: 'transparent',
                            font: {
                              color: 'var(--color-foreground)',
                            },
                            xaxis: {
                              ...hasData.layout.xaxis,
                              gridcolor: 'var(--color-border)',
                            },
                            yaxis: {
                              ...hasData.layout.yaxis,
                              gridcolor: 'var(--color-border)',
                            },
                          }}
                          config={{
                            responsive: true,
                            displayModeBar: true,
                            displaylogo: false,
                          }}
                          style={{ width: '100%', height: '300px' }}
                        />
                      </div>
                    ) : (
                      <div className="bg-muted rounded-md flex items-center justify-center h-48">
                        <span className="text-muted-foreground text-sm">
                          Click "Plot Graphs" to load data
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
