'use client';

import ReactECharts from 'echarts-for-react';
import { useTheme } from 'next-themes';

/**
 * MetricsChartInner — the actual ECharts rendering component.
 *
 * This module is the ONLY place `echarts` and `echarts-for-react` are imported.
 * It is loaded exclusively via the `next/dynamic` boundary in metrics-chart.tsx.
 * Do NOT import this file anywhere else — doing so will pull ECharts back into
 * the main vendor bundle and defeat the code-splitting.
 */
export default function MetricsChartInner() {
  const { theme } = useTheme();

  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['Champion (XGBoost)', 'Challenger (LightGBM)'],
      textStyle: { color: theme === 'dark' ? '#fff' : '#000' },
    },
    xAxis: {
      type: 'category',
      data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      axisLabel: { color: theme === 'dark' ? '#ccc' : '#666' },
    },
    yAxis: {
      type: 'value',
      name: 'AUC-ROC Score',
      min: 0.90,
      max: 1.0,
      axisLabel:     { color: theme === 'dark' ? '#ccc' : '#666' },
      nameTextStyle: { color: theme === 'dark' ? '#ccc' : '#666' },
    },
    series: [
      {
        name: 'Champion (XGBoost)',
        data: [0.942, 0.945, 0.948, 0.947, 0.951, 0.952, 0.955],
        type: 'line',
        smooth: true,
        itemStyle: { color: '#10b981' },
      },
      {
        name: 'Challenger (LightGBM)',
        data: [0.935, 0.938, 0.941, 0.944, 0.946, 0.949, 0.950],
        type: 'line',
        smooth: true,
        itemStyle: { color: '#f59e0b' },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '350px', width: '100%' }}
      theme={theme === 'dark' ? 'dark' : 'light'}
    />
  );
}
