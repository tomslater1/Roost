import { useState, useEffect, useCallback } from 'react'

export function useUpdater() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ status: 'idle' })

  useEffect(() => {
    if (!window.api?.onUpdateStatus) return
    window.api.onUpdateStatus(setUpdateStatus)
    return () => window.api.removeUpdateStatusListener()
  }, [])

  const downloadUpdate = useCallback(() => {
    window.api?.downloadUpdate()
  }, [])

  const installUpdate = useCallback(() => {
    window.api?.installUpdate()
  }, [])

  return { updateStatus, downloadUpdate, installUpdate }
}
