import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────────────────
  const user        = ref(null)
  const profile     = ref(null)
  const initialized = ref(false)

  // ── Getters ────────────────────────────────────────────
  const isLoggedIn  = computed(() => !!user.value)
  const userId      = computed(() => user.value?.id ?? null)
  const role        = computed(() => profile.value?.role ?? 'student')
  const isAdmin     = computed(() => role.value === 'admin')
  const displayName = computed(
    () => profile.value?.display_name ?? user.value?.email ?? ''
  )
  const avatarUrl = computed(() => profile.value?.avatar_url ?? null)
  const enterpriseId = computed(() => profile.value?.enterprise_id ?? null)

  // ── Helpers ────────────────────────────────────────────
  // Fire-and-forget only — never awaited in the auth event path.
  function fetchProfile(uid) {
    supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()
      .then(({ data }) => { profile.value = data })
      .catch((e) => console.warn('[auth] fetchProfile failed:', e?.message))
  }

  // ── Init ────────────────────────────────────────────────
  // Rules:
  //  1. Callback MUST be synchronous — any await inside blocks resolve().
  //  2. Profile fetch is fire-and-forget — never awaited in callback.
  //  3. Concurrent calls share one promise (lock via _initPromise).
  //  4. 5-second timeout fallback in case INITIAL_SESSION never fires.
  let _initPromise = null

  async function init() {
    if (initialized.value) return
    if (_initPromise) return _initPromise

    const waitForSession = new Promise((resolve) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {            // ← synchronous, no async/await here
          user.value = session?.user ?? null

          if (user.value) {
            fetchProfile(user.value.id)  // ← fire-and-forget, no await
          } else {
            profile.value = null
          }

          if (event === 'INITIAL_SESSION') {
            initialized.value = true
            resolve()
            setTimeout(() => subscription.unsubscribe(), 0)
          }
        }
      )
    })

    // Fallback: if INITIAL_SESSION never fires (e.g. Supabase SDK edge case),
    // force-resolve after 5 s so the app never hangs on a white screen.
    const timeout = new Promise((resolve) => setTimeout(() => {
      if (!initialized.value) {
        console.warn('[auth] init timeout — forcing resolve')
        initialized.value = true
      }
      resolve()
    }, 5000))

    _initPromise = Promise.race([waitForSession, timeout])

    // Persistent listener for auth changes AFTER init
    supabase.auth.onAuthStateChange((event, session) => {
      if (!initialized.value) return          // still initializing
      if (event === 'INITIAL_SESSION') return  // already handled

      user.value = session?.user ?? null
      if (user.value) {
        fetchProfile(user.value.id)
      } else {
        profile.value = null
      }
    })

    return _initPromise
  }

  // ── Actions ────────────────────────────────────────────
  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/quiz` }
    })
    if (error) throw error
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('[auth] signOut error:', e?.message)
    }
    user.value    = null
    profile.value = null
  }

  return {
    user, profile, initialized,
    isLoggedIn, userId, role, isAdmin, displayName, avatarUrl, enterpriseId,
    init, signInWithGoogle, signOut
  }
})
