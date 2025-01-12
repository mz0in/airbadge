import { SvelteKitAuth } from './index'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

describe('SvelteKitAuth', () => {
  test('when no plans, raises an error', () => {
    expect(() => SvelteKitAuth({})).toThrowError('Must have at least one plan')
  })

  test('when plans empty, raises an error', () => {
    expect(() => SvelteKitAuth({ plans: [] })).toThrowError('Must have at least one plan')
  })

  test('when no providers, raises an error', () => {
    expect(() => SvelteKitAuth({ plans: [{}] })).toThrowError('Must have at least one provider')
  })

  test('when providers empty, raises an error', () => {
    expect(() => SvelteKitAuth({ plans: [{}], providers: [] })).toThrowError(
      'Must have at least one provider'
    )
  })

  test('when no adapter, raises an error', () => {
    expect(() => SvelteKitAuth({ plans: [{}], providers: [{}] })).toThrowError(
      'An adapter is reqiured'
    )
  })

  describe('when configured', () => {
    const config = {
      adapter: new PrismaAdapter(db),
      providers: [{ id: 'google' }],
      plans: [{ id: 'pro', name: 'Pro' }]
    }

    test('handles /auth', async () => {
      const handler = SvelteKitAuth(config)

      const url = new URL('http://localhost/auth/providers')
      //
      const response = await handler({
        event: {
          url,
          locals: {},
          request: {
            url,
            headers: new Map(),
            method: 'GET'
          }
        }
      })

      expect(response.status).toEqual(200)
    })

    test('handles /billing', async () => {
      const handler = SvelteKitAuth(config)

      const response = await handler({
        event: {
          url: new URL('http://localhost/billing/plans'),
          locals: {
            getSession() {}
          },
          request: {
            method: 'GET'
          }
        }
      })

      expect(response.status).toEqual(200)
    })

    test('ignores everything else', async () => {
      const resolve = vi.fn()
      const handler = SvelteKitAuth(config)
      const event = {
        url: new URL('http://localhost/unknown'),
        locals: {
          getSession() {}
        },
        request: {
          method: 'GET'
        }
      }

      const response = await handler({ resolve, event })

      expect(response).toBeUndefined()
      expect(resolve).toHaveBeenCalled()
    })
  })
})
