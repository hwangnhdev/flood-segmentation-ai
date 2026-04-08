// Shared TypeScript types for the flood segmentation app

export interface ClassStat {
  id: number;
  name: string;
  color: string;   // "rgb(r,g,b)"
  hex: string;     // "#rrggbb"
  pixel_pct: number;
}

export interface ModelMetrics {
  accuracy: number;
  dice: number;
  iou: number;
  loss: number;
}

export interface PredictionResult {
  input_image: string;       // base64 PNG
  predicted_mask: string;    // base64 PNG
  overlay: string;           // base64 PNG
  class_stats: ClassStat[];
  model_metrics: ModelMetrics;
}

export interface ConfigClass {
  id: number;
  name: string;
  color: [number, number, number];
}

export interface ModelInfo {
  id: string;
  name: string;
}

export interface AppConfig {
  model_name: string;
  num_classes: number;
  val_metrics: ModelMetrics;
  available_models?: ModelInfo[];
  classes: ConfigClass[];
}
