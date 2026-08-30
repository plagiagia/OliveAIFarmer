export interface WeatherObservationSample {
  observedAt: Date
  temperature: number
  humidity: number
  rainfall: number
  windSpeed: number
  windGust: number | null
  windDirection: number | null
  pressure: number | null
  clouds: number | null
  condition: string
  icon: string | null
  source: string
}

export interface DailyWeatherAggregate {
  tempHigh: number
  tempLow: number
  tempAvg: number
  humidity: number
  rainfall: number
  windSpeed: number
  windGust: number | undefined
  windDirection: number | null
  pressure: number | undefined
  clouds: number | undefined
  condition: string
  icon: string | null
  source: 'API_CURRENT' | 'CRON_DAILY'
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function averageOptional(values: Array<number | null>) {
  const present = values.filter((value): value is number => value !== null)
  return present.length > 0 ? Math.round(average(present)) : undefined
}

export function aggregateWeatherObservations(
  observations: WeatherObservationSample[]
): DailyWeatherAggregate {
  if (observations.length === 0) {
    throw new Error('Cannot aggregate an empty observation set')
  }

  const ordered = [...observations].sort(
    (a, b) => a.observedAt.getTime() - b.observedAt.getTime()
  )
  const latest = ordered[ordered.length - 1]
  const temperatures = ordered.map((observation) => observation.temperature)
  const humidities = ordered.map((observation) => observation.humidity)
  const windSpeeds = ordered.map((observation) => observation.windSpeed)
  const gusts = ordered
    .map((observation) => observation.windGust)
    .filter((value): value is number => value !== null)

  return {
    tempHigh: Math.max(...temperatures),
    tempLow: Math.min(...temperatures),
    tempAvg: average(temperatures),
    humidity: Math.round(average(humidities)),
    rainfall: ordered.reduce((sum, observation) => sum + observation.rainfall, 0),
    windSpeed: average(windSpeeds),
    windGust: gusts.length > 0 ? Math.max(...gusts) : undefined,
    windDirection: latest.windDirection,
    pressure: averageOptional(ordered.map((observation) => observation.pressure)),
    clouds: averageOptional(ordered.map((observation) => observation.clouds)),
    condition: latest.condition,
    icon: latest.icon,
    source: ordered.some((observation) => observation.source === 'CRON_INTRADAY')
      ? 'CRON_DAILY'
      : 'API_CURRENT'
  }
}
