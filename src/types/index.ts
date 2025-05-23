// User types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  farmName?: string
  location?: string
  createdAt: Date
  updatedAt: Date
}

// Farm types
export interface Farm {
  id: string
  name: string
  location: string
  area: number // in hectares
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

// Tree types
export interface Tree {
  id: string
  farmId: string
  variety: string
  plantingDate?: Date
  location: {
    lat: number
    lng: number
  }
  status: 'healthy' | 'sick' | 'dead' | 'young'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Activity types
export interface Activity {
  id: string
  farmId: string
  type: ActivityType
  description: string
  date: Date
  cost?: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export type ActivityType = 
  | 'watering'
  | 'fertilizing'
  | 'pruning'
  | 'harvesting'
  | 'pest_control'
  | 'soil_treatment'
  | 'other'

// Harvest types
export interface Harvest {
  id: string
  farmId: string
  date: Date
  quantity: number // in kg
  quality: 'excellent' | 'good' | 'average' | 'poor'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Weather types
export interface WeatherData {
  date: Date
  temperature: {
    min: number
    max: number
  }
  humidity: number
  rainfall: number
  windSpeed: number
  conditions: string
}

// Notification types
export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  createdAt: Date
} 