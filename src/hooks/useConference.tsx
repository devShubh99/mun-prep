import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Conference } from '../types'

interface ConferenceContextValue {
  conference: Conference | null
  loading: boolean
  conferenceError: string | null
  conferences: Conference[]
  archivedConferences: Conference[]
  refreshConferences: () => Promise<void>
  updateConference: (partial: Partial<Conference>) => Promise<string | null>
  createConference: (data: Partial<Conference>) => Promise<Conference | null>
  archiveConference: (id: string) => Promise<string | null>
  restoreConference: (id: string) => Promise<string | null>
  permanentlyDeleteConference: (id: string) => Promise<string | null>
  deleteConference: (id: string) => Promise<string | null>
  setActiveConferenceId: (id: string | null) => void
  activeConferenceId: string | null
  tasks: Record<string, string | null>
  setTask: (key: string, label: string | null) => void
}

const ConferenceContext = createContext<ConferenceContextValue | null>(null)

export function ConferenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [conferences, setConferences] = useState<Conference[]>([])
  const [archivedConferences, setArchivedConferences] = useState<Conference[]>([])
  const [loading, setLoading] = useState(true)
  const [conferenceError, setConferenceError] = useState<string | null>(null)
  const [activeConferenceId, setActiveConferenceId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Record<string, string | null>>({})
  const setTask = useCallback((key: string, label: string | null) => {
    setTasks(prev => ({ ...prev, [key]: label }))
  }, [])

  const fetchConferences = useCallback(async () => {
    if (!user) {
      setConferences([])
      setArchivedConferences([])
      setLoading(false)
      return
    }
    setLoading(true)
    setConferenceError(null)
    const { data, error } = await supabase
      .from('conferences')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) setConferenceError(error.message)
    else if (data) {
      setConferences((data as Conference[]).filter(c => !c.archived))
      setArchivedConferences((data as Conference[]).filter(c => c.archived))
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchConferences() }, [fetchConferences])

  const conference = useMemo(
    () => conferences.find(c => c.id === activeConferenceId) ?? null,
    [conferences, activeConferenceId]
  )

  const updateConference = useCallback(async (partial: Partial<Conference>): Promise<string | null> => {
    if (!activeConferenceId) return null
    const { error } = await supabase.from('conferences').update(partial).eq('id', activeConferenceId)
    if (error) return error.message
    setConferences(prev => prev.map(c => c.id === activeConferenceId ? { ...c, ...partial } : c))
    return null
  }, [activeConferenceId])

  const createConference = useCallback(async (data: Partial<Conference>): Promise<Conference | null> => {
    if (!user) return null
    const { data: inserted, error } = await supabase
      .from('conferences')
      .insert({ ...data, user_id: user.id, archived: false })
      .select()
      .single()
    if (error || !inserted) return null
    setConferences(prev => [inserted as Conference, ...prev])
    return inserted as Conference
  }, [user])

  const archiveConference = useCallback(async (id: string): Promise<string | null> => {
    const { error } = await supabase.from('conferences').update({ archived: true }).eq('id', id)
    if (error) return error.message
    setConferences(prev => prev.filter(c => c.id !== id))
    setArchivedConferences(prev => [...prev, conferences.find(c => c.id === id)!])
    if (activeConferenceId === id) setActiveConferenceId(null)
    return null
  }, [activeConferenceId, conferences])

  const restoreConference = useCallback(async (id: string): Promise<string | null> => {
    const { error } = await supabase.from('conferences').update({ archived: false }).eq('id', id)
    if (error) return error.message
    setArchivedConferences(prev => prev.filter(c => c.id !== id))
    const restored = archivedConferences.find(c => c.id === id)
    if (restored) setConferences(prev => [{ ...restored, archived: false }, ...prev])
    return null
  }, [archivedConferences])

  const permanentlyDeleteConference = useCallback(async (id: string): Promise<string | null> => {
    const { error } = await supabase.from('conferences').delete().eq('id', id)
    if (error) return error.message
    setArchivedConferences(prev => prev.filter(c => c.id !== id))
    if (activeConferenceId === id) setActiveConferenceId(null)
    return null
  }, [activeConferenceId])

  const deleteConference = useCallback(async (id: string): Promise<string | null> => {
    const { error } = await supabase.from('conferences').delete().eq('id', id)
    if (error) return error.message
    setConferences(prev => prev.filter(c => c.id !== id))
    if (activeConferenceId === id) setActiveConferenceId(null)
    return null
  }, [activeConferenceId])

  const value = useMemo(() => ({
    conference, loading, conferenceError, conferences, archivedConferences,
    refreshConferences: fetchConferences,
    updateConference, createConference, archiveConference, restoreConference,
    permanentlyDeleteConference, deleteConference,
    setActiveConferenceId, activeConferenceId,
    tasks, setTask,
  }), [conference, loading, conferenceError, conferences, archivedConferences,
      fetchConferences, updateConference, createConference,
      archiveConference, restoreConference, permanentlyDeleteConference,
      deleteConference, activeConferenceId, tasks, setTask])

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
