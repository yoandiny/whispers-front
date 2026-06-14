// ─── Message ────────────────────────────────────────────────────────────────

export interface Message {
  id: string
  text: string
  time: Date
  read: boolean
}

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  username: string
  role: UserRole
  createdAt: Date
}

// ─── API Response wrapper ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthPayload {
  username: string
  password?: string
}

export interface AuthResponse {
  token: string
  user: User
}

// ─── Send Message ─────────────────────────────────────────────────────────────

export interface SendMessagePayload {
  text: string
}
