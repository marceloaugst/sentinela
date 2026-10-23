import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { CreateChannel } from '@/types/api'
import { settingsService, type AuditParams, type UserListParams } from '../services/settingsService'

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => settingsService.health(signal),
    retry: false,
  })
}

export function useChannels() {
  return useQuery({ queryKey: ['channels'], queryFn: ({ signal }) => settingsService.channels(signal) })
}

function useInvalidate(key: string) {
  const qc = useQueryClient()
  return () => void qc.invalidateQueries({ queryKey: [key] })
}

export function useCreateChannel() {
  const invalidate = useInvalidate('channels')
  return useMutation({
    mutationFn: (input: CreateChannel) => settingsService.createChannel(input),
    meta: { silent: true },
    onSuccess: () => {
      toast.success('Canal criado.')
      invalidate()
    },
  })
}

export function useUpdateChannel() {
  const invalidate = useInvalidate('channels')
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<CreateChannel>) => settingsService.updateChannel(id, input),
    meta: { silent: true },
    onSuccess: () => {
      toast.success('Canal atualizado.')
      invalidate()
    },
  })
}

export function useDeleteChannel() {
  const invalidate = useInvalidate('channels')
  return useMutation({
    mutationFn: (id: string) => settingsService.removeChannel(id),
    onSuccess: () => {
      toast.success('Canal removido.')
      invalidate()
    },
  })
}

export function useTestChannel() {
  return useMutation({
    mutationFn: (id: string) => settingsService.testChannel(id),
    onSuccess: () => toast.success('Mensagem de teste enfileirada. Ela chega em alguns segundos.'),
  })
}

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: ({ signal }) => settingsService.users(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useCreateUser() {
  const invalidate = useInvalidate('users')
  return useMutation({
    mutationFn: settingsService.createUser,
    meta: { silent: true },
    onSuccess: () => {
      toast.success('Usuário criado.')
      invalidate()
    },
  })
}

export function useUpdateUser() {
  const invalidate = useInvalidate('users')
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Parameters<typeof settingsService.updateUser>[1]) => settingsService.updateUser(id, input),
    meta: { silent: true },
    onSuccess: () => {
      toast.success('Usuário atualizado.')
      invalidate()
    },
  })
}

export function useRevokeSessions() {
  return useMutation({
    mutationFn: (id: string) => settingsService.revokeSessions(id),
    onSuccess: (r) => toast.success(`${r.revoked_sessions} sessão(ões) revogada(s).`),
  })
}

export function useAuditLogs(params: AuditParams) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: ({ signal }) => settingsService.auditLogs(params, signal),
    placeholderData: keepPreviousData,
  })
}
