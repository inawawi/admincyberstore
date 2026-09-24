import { defineStore } from 'pinia'
import { useCookie, useRequestURL } from '#imports'
import { sessionCookieOptions, isCurrentSessionUnauthorized } from '~/utils/auth-session'
import { useApi } from '~/composables/useApi'

export interface UserProfile {
  id: number | string
  name: string
  email: string
  phone?: string | null
  address?: string | null
  photo?: string | null
  avatar?: string | null
  email_verified_at?: string | null
  role?: string
  push_notifications_enabled?: boolean
  email_notifications_enabled?: boolean
  biometric_login_enabled?: boolean
  created_at?: string | null
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as UserProfile | null,
    token: '' as string,
    isLoading: false,
    authError: '' as string,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    initAuth() {
      const tokenCookie = useCookie<string | null>('cyber_store_token')
      const userCookie = useCookie<UserProfile | null>('cyber_store_user')

      if (tokenCookie.value) {
        this.token = tokenCookie.value
      }

      if (userCookie.value) {
        this.user = userCookie.value
      }

      if (import.meta.client && this.token) {
        // Refresh profile in background to keep data fresh
        this.fetchMe()
      }
    },

    setSession(token: string, user?: UserProfile) {
      this.token = token
      if (user) {
        this.user = user
      }
      // This storefront sends Bearer tokens from the client; its cookie must
      // be writable/readable by the client as well, including after a redirect.
      const options = sessionCookieOptions(useRequestURL().protocol)
      const tokenCookie = useCookie<string | null>('cyber_store_token', options)
      tokenCookie.value = token

      const userCookie = useCookie<UserProfile | null>('cyber_store_user', options)
      if (user) {
        userCookie.value = user
      }
    },

    clearSession() {
      this.token = ''
      this.user = null
      const tokenCookie = useCookie<string | null>('cyber_store_token')
      const userCookie = useCookie<UserProfile | null>('cyber_store_user')
      tokenCookie.value = null
      userCookie.value = null
    },

    async login(email: string, password: string): Promise<{ success: boolean; message?: string; requireOtp?: boolean }> {
      this.isLoading = true
      this.authError = ''
      const { apiBase } = useApi()

      try {
        const res = await $fetch<any>(`${apiBase}/login`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: { email, password },
        })

        if (res.token) {
          this.setSession(res.token, res.user)
          return { success: true }
        } else if (res.require_otp) {
          return { success: false, requireOtp: true, message: res.message || 'Silakan masukkan kode OTP.' }
        }

        return { success: true }
      } catch (err: any) {
        const msg = err.data?.message || err.message || 'Login gagal. Periksa kembali email dan password Anda.'
        this.authError = msg
        return { success: false, message: msg }
      } finally {
        this.isLoading = false
      }
    },

    async register(name: string, email: string, password: string, passwordConfirmation: string, phone?: string): Promise<{ success: boolean; message?: string; requireOtp?: boolean }> {
      this.isLoading = true
      this.authError = ''
      const { apiBase } = useApi()

      try {
        const payload: Record<string, any> = {
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }

        if (phone) {
          payload.phone = phone
          payload.phone_number = phone
          payload.no_hp = phone
        }

        const res = await $fetch<any>(`${apiBase}/register`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: payload,
        })

        if (res.token) {
          this.setSession(res.token, res.user)
          return { success: true, message: res.message }
        }

        return { success: true, requireOtp: true, message: res.message || 'Pendaftaran berhasil. Silakan verifikasi email Anda.' }
      } catch (err: any) {
        const msg = err.data?.message || err.message || 'Pendaftaran gagal. Periksa data yang Anda masukkan.'
        this.authError = msg
        return { success: false, message: msg }
      } finally {
        this.isLoading = false
      }
    },

    async verifyOtp(email: string, otpCode: string): Promise<{ success: boolean; message?: string }> {
      this.isLoading = true
      const { apiBase } = useApi()

      try {
        const cleanEmail = String(email || '').trim()
        const cleanOtp = String(otpCode || '').trim()

        const res = await $fetch<any>(`${apiBase}/verify-otp`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: {
            email: cleanEmail,
            otp: cleanOtp,          // Field wajib di Laravel backend
            otp_code: cleanOtp,     // Fallback alternatif
            code: cleanOtp,         // Fallback alternatif
          },
        })

        if (res.token) {
          this.setSession(res.token, res.user)
          return { success: true, message: res.message }
        }

        return { success: true, message: res.message }
      } catch (err: any) {
        const msg = err.data?.errors?.otp?.[0] || err.data?.errors?.email?.[0] || err.data?.message || err.message || 'Kode OTP tidak valid.'
        return { success: false, message: msg }
      } finally {
        this.isLoading = false
      }
    },

    async resendOtp(email: string): Promise<{ success: boolean; message?: string }> {
      this.isLoading = true
      const { apiBase } = useApi()

      try {
        const res = await $fetch<any>(`${apiBase}/resend-otp`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: { email },
        })

        return { success: true, message: res.message || 'Kode OTP baru berhasil dikirimkan.' }
      } catch (err: any) {
        const msg = err.data?.message || err.message || 'Gagal mengirim ulang kode OTP.'
        return { success: false, message: msg }
      } finally {
        this.isLoading = false
      }
    },

    async loginWithGoogle(idToken: string): Promise<{ success: boolean; message?: string }> {
      this.isLoading = true
      this.authError = ''
      const { apiBase } = useApi()

      try {
        const res = await $fetch<any>(`${apiBase}/auth/google`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: { id_token: idToken },
        })

        if (res.token) {
          this.setSession(res.token, res.user)
          return { success: true, message: res.message || 'Login Google berhasil.' }
        }

        return { success: true, message: res.message }
      } catch (err: any) {
        const msg = err.data?.message || err.data?.errors?.id_token?.[0] || err.message || 'Login Google gagal.'
        this.authError = msg
        return { success: false, message: msg }
      } finally {
        this.isLoading = false
      }
    },

    async handleGoogleCallback(payload: { code?: string; token?: string; user?: any }): Promise<{ success: boolean; message?: string }> {
      this.isLoading = true
      this.authError = ''
      const { apiBase } = useApi()

      // Skenario 1: Token Sanctum sudah dikirim langsung oleh redirect backend
      if (payload.token) {
        this.setSession(payload.token, payload.user)
        if (!payload.user) {
          await this.fetchMe()
        }
        this.isLoading = false
        return { success: true, message: 'Login Google berhasil.' }
      }

      // Skenario 2: Tukar authorization code dengan backend (hanya satu kali — code bersifat single-use)
      if (payload.code) {
        try {
          const res = await $fetch<any>(`${apiBase}/auth/google/callback`, {
            method: 'GET',
            params: { code: payload.code },
            headers: {
              Accept: 'application/json',
            },
          })

          if (res?.token) {
            this.setSession(res.token, res.user)
            if (!res.user) {
              await this.fetchMe()
            }
            return { success: true, message: res.message || 'Login Google berhasil.' }
          }

          return { success: false, message: res?.message || 'Gagal memproses autentikasi Google.' }
        } catch (err: any) {
          const msg = err.data?.message || err.message || 'Verifikasi login Google gagal.'
          this.authError = msg
          return { success: false, message: msg }
        } finally {
          this.isLoading = false
        }
      }

      this.isLoading = false
      return { success: false, message: 'Tidak ada token atau authorization code yang ditemukan.' }
    },

    async fetchMe() {
      if (!this.token) return
      const sessionToken = this.token
      const { apiBase } = useApi()
      const userCookie = useCookie<UserProfile | null>(
        'cyber_store_user', sessionCookieOptions(useRequestURL().protocol),
      )

      try {
        const res = await $fetch<any>(`${apiBase}/me`, {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        })
        // A response from an old login must not overwrite a newer session.
        if (this.token !== sessionToken) return
        if (res.user) {
          this.user = res.user
          userCookie.value = res.user
        }
      } catch (err) {
        if (isCurrentSessionUnauthorized(err, sessionToken, this.token)) {
          this.clearSession()
        } else {
          console.warn('Profile refresh failed; current session preserved.')
        }
      }
    },

    async updateProfile(formData: FormData): Promise<{ success: boolean; message?: string; errors?: any; user?: any }> {
      this.isLoading = true
      this.authError = ''
      const { apiBase } = useApi()

      try {
        const headers: Record<string, string> = {
          Accept: 'application/json',
          Authorization: `Bearer ${this.token}`,
        }
        if (apiBase.includes('ngrok-free')) {
          headers['ngrok-skip-browser-warning'] = 'true'
        }

        const res = await $fetch<any>(`${apiBase}/profile`, {
          method: 'POST',
          headers,
          body: formData,
        })

        if (res.user) {
          this.user = res.user
        }

        return {
          success: true,
          message: res.message || 'Profil berhasil diperbarui.',
          user: res.user,
        }
      } catch (err: any) {
        const errors = err.data?.errors
        const msg = err.data?.message || err.message || 'Gagal memperbarui profil.'
        this.authError = msg
        return {
          success: false,
          message: msg,
          errors,
        }
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      const { apiBase } = useApi()
      if (this.token) {
        try {
          await $fetch(`${apiBase}/logout`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.token}`,
              Accept: 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
          })
        } catch (e) {
          console.warn('Logout API failed:', e)
        }
      }
      this.clearSession()
    },

    async forgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
      this.isLoading = true
      this.authError = ''
      const { apiBase } = useApi()

      try {
        const res = await $fetch<any>(`${apiBase}/forgot-password`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: { email },
        })

        return { success: true, message: res.message || 'Instruksi reset password telah dikirim ke email Anda.' }
      } catch (err: any) {
        const msg = err.data?.message || err.data?.errors?.email?.[0] || err.message || 'Gagal memproses permintaan reset password.'
        this.authError = msg
        return { success: false, message: msg }
      } finally {
        this.isLoading = false
      }
    },

    async resetPassword(resetToken: string, password: string, passwordConfirmation: string): Promise<{ success: boolean; message?: string }> {
      this.isLoading = true
      this.authError = ''
      const { apiBase } = useApi()

      try {
        const res = await $fetch<any>(`${apiBase}/reset-password`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: {
            reset_token: resetToken,
            password,
            password_confirmation: passwordConfirmation,
          },
        })

        return { success: true, message: res.message || 'Password berhasil diperbarui. Silakan login kembali.' }
      } catch (err: any) {
        const msg = err.data?.message || err.message || 'Gagal memperbarui password.'
        this.authError = msg
        return { success: false, message: msg }
      } finally {
        this.isLoading = false
      }
    },
  },
})
