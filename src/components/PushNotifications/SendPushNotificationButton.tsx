'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Button, toast, useDocumentInfo, usePayloadAPI } from '@payloadcms/ui'

const SendPushNotificationButton: React.FC = () => {
  const { id, collection, data } = useDocumentInfo()
  const { fetch } = usePayloadAPI()
  const [isSending, setIsSending] = useState(false)

  const status = data?.status as string | undefined

  const disabledReason = useMemo(() => {
    if (!id) return 'Save the draft before sending'
    if (status && status !== 'draft') return 'Only draft notifications can be sent'
    return null
  }, [id, status])

  const handleSend = useCallback(async () => {
    if (!id || !collection?.slug || disabledReason) return

    setIsSending(true)

    try {
      const response = await fetch(`/api/${collection.slug}/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'sending' }),
      })

      if (!response.ok) {
        let message = 'Unable to start sending'

        try {
          const body = await response.json()
          message = body?.errors?.[0]?.message ?? message
        } catch (error) {
          // Ignore JSON parse errors and use default message
        }

        throw new Error(message)
      }

      toast.success('Sending started. This page will refresh as status updates.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start sending')
    } finally {
      setIsSending(false)
    }
  }, [collection?.slug, disabledReason, fetch, id])

  return (
    <Button
      buttonStyle="primary"
      disabled={Boolean(disabledReason) || isSending}
      onClick={handleSend}
      size="medium"
    >
      {disabledReason ?? (isSending ? 'Starting send…' : 'Send notification')}
    </Button>
  )
}

export default SendPushNotificationButton
