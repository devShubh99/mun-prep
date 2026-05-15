import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Conference } from '../types'

interface ConferenceContextValue {
  conference: Conference | null
  loading: boolean
  conferences: Conference[]
  refreshConferences: () => Promise<void>
  updateConference: (partial: Partial<Conference>) => Promise<void>
  createConference: (data: Partial<Conference>) => Promise<Conference | null>
  deleteConference: (id: string) => Promise<void>
  setActiveConferenceId: (id: string | null) => void
  activeConferenceId: string | null
}

const ConferenceContext = createContext<ConferenceContextValue | null>(null)

export function ConferenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [conferences, setConferences] = useState<Conference[]>([])
  const [loading, setLoading] = useState(true)
  const [activeConferenceId, setActiveConferenceId] = useState<string | null>(null)

  const fetchConferences = useCallback(async () => {
    if (!user) {
      setConferences([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('conferences')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setConferences(data as Conference[])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchConferences() }, [fetchConferences])

  const conference = useMemo(
    () => conferences.find(c => c.id === activeConferenceId) ?? null,
    [conferences, activeConferenceId]
  )

  const updateConference = useCallback(async (partial: Partial<Conference>) => {
    if (!activeConferenceId) return
    await supabase.from('conferences').update(partial).eq('id', activeConferenceId)
    setConferences(prev => prev.map(c => c.id === activeConferenceId ? { ...c, ...partial } : c))
  }, [activeConferenceId])

  const createConference = useCallback(async (data: Partial<Conference>): Promise<Conference | null> => {
    if (!user) return null
    const { data: inserted, error } = await supabase
      .from('conferences')
      .insert({ ...data, user_id: user.id })
      .select()
      .single()
    if (error || !inserted) return null
    setConferences(prev => [inserted as Conference, ...prev])
    return inserted as Conference
  }, [user])

  const deleteConference = useCallback(async (id: string) => {
    await supabase.from('conferences').delete().eq('id', id)
    setConferences(prev => prev.filter(c => c.id !== id))
    if (activeConferenceId === id) setActiveConferenceId(null)
  }, [activeConferenceId])

  const value = useMemo(() => ({
    conference, loading, conferences, refreshConferences: fetchConferences,
    updateConference, createConference, deleteConference,
    setActiveConferenceId, activeConferenceId,
  }), [conference, loading, conferences, fetchConferences, updateConference, createConference, deleteConference, activeConferenceId])

  return (
    <ConferenceContext.Provider value={value}>
      {children}
    </ConferenceContext.Provider>
  )
}

export function useConference() {
  const ctx = useContext(ConferenceContext)
  if (!ctx) throw new Error('useConference must be used within ConferenceProvider')
  return ctx
}
