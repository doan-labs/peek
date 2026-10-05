import { createFileRoute } from '@tanstack/react-router'
import { llmsFull } from '@/lib/docs'

export const Route = createFileRoute('/llms-full.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(llmsFull(), {
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        }),
    },
  },
})
