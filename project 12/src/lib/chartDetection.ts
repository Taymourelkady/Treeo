import type { Metric } from './metricsService';

// Keywords that suggest different chart types
const KEYWORDS = {
  TIME_SERIES: ['date', 'month', 'year', 'daily', 'weekly', 'monthly', 'quarterly', 'annually'],
  AGGREGATION: ['sum', 'count', 'avg', 'average', 'total'],
  PERCENTAGE: ['rate', 'ratio', 'percentage', '%', 'share', 'distribution'],
  COMPARISON: ['by', 'per', 'across', 'between', 'compare']
};

/**
 * Analyzes a metric's calculation method to suggest the best visualization type
 */
export function detectVisualizationType(metric: Pick<Metric, 'calculation_method' | 'name'>): 'line' | 'bar' | 'pie' | 'metric' {
  const text = `${metric.calculation_method} ${metric.name}`.toLowerCase();
  
  // Check for time series patterns
  const hasTimePattern = KEYWORDS.TIME_SERIES.some(keyword => text.includes(keyword));
  if (hasTimePattern) {
    return 'line';
  }

  // Check for percentage/distribution patterns
  const hasPercentagePattern = KEYWORDS.PERCENTAGE.some(keyword => text.includes(keyword));
  if (hasPercentagePattern) {
    return 'pie';
  }

  // Check for comparison patterns
  const hasComparisonPattern = KEYWORDS.COMPARISON.some(keyword => text.includes(keyword));
  if (hasComparisonPattern) {
    return 'bar';
  }

  // Check for aggregation patterns
  const hasAggregationPattern = KEYWORDS.AGGREGATION.some(keyword => text.includes(keyword));
  if (hasAggregationPattern) {
    return 'metric';
  }

  // Default to metric if no clear pattern is found
  return 'metric';
}

/**
 * Get a human-readable label for a visualization type
 */
export function getVisualizationLabel(type: 'line' | 'bar' | 'pie' | 'metric'): string {
  const labels = {
    line: 'Time Series',
    bar: 'Comparison',
    pie: 'Distribution',
    metric: 'Single Value'
  };
  return labels[type];
}