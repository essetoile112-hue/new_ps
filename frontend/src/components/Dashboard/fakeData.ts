export const makeFakeSensorData = (points = 24) => {
  const now = Date.now();
  const hour = 1000 * 60 * 60;
  const data = Array.from({ length: points }).map((_, i) => {
    const ts = new Date(now - (points - i - 1) * hour);
    return {
      ts: ts.toISOString(),
      label: `${ts.getHours()}:00`,
      temperature: +(20 + Math.sin(i / 3) * 6 + Math.random() * 2).toFixed(2),
      humidity: +(55 + Math.cos(i / 4) * 10 + Math.random() * 3).toFixed(2),
      moisture: +(30 + Math.abs(Math.sin(i / 2)) * 40 + Math.random() * 5).toFixed(2),
    };
  });
  return data;
};

export const makeSummary = (data: ReturnType<typeof makeFakeSensorData>) => {
  const avg = (key: keyof ReturnType<typeof makeFakeSensorData>[number]) =>
    (
      data.reduce((s, d) => s + Number(d[key] as any || 0), 0) / data.length
    ).toFixed(2);

  return {
    avgTemperature: avg('temperature'),
    avgHumidity: avg('humidity'),
    avgMoisture: avg('moisture'),
  };
};
