import arcjet, { detectBot, shield, slidingWindow } from '@arcjet/node'

const arcjetKey = process.env.ARCJET_KEY
const arcjetMode = process.env.ARCJET_MODE === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE'

if (!arcjetKey) {
    throw new Error('ARCJET_KEY is not set')
}

export const httpArcjet = arcjet({
    key: arcjetKey,
    rules: [
        shield({ mode: arcjetMode }),
        detectBot({
            mode: arcjetMode,
            allow: [
                'CATEGORY:SEARCH_ENGINE',
                'CATEGORY:PREVIEW',
                'CATEGORY:BROWSER',
                'CATEGORY:DEVELOPER_TOOL'
            ]
        }),
        slidingWindow({
            mode: arcjetMode,
            interval: '10s',
            max: 50
        })
    ]
})

export const wsArcjet = arcjet({
    key: arcjetKey,
    rules: [
        shield({ mode: arcjetMode }),
        detectBot({
            mode: arcjetMode,
            allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW']
        }),
        slidingWindow({
            mode: arcjetMode,
            interval: '2s',
            max: 5
        })
    ]
})

// export function securityMiddleware() {
//     return async (req, res, next) => {
//         try {
//             const decision = await httpArcjet.protect(req)

//             if (decision.isDenied()) {
//                 if (decision.reason.isRateLimit()) {
//                     return res.status(429).json({ error: 'Too many requests' })
//                 }
//                 return res.status(403).json({ error: 'Forbidden' })
//             }

//             return next()
//         } catch (err) {
//             console.error('Arcjet error:', err)
//             return res.status(500).json({
//                 error: 'Internal Arcjet Error'
//             })
//         }
//     }
// }

export function securityMiddleware() {
  return async (req, res, next) => {
    if (req.hostname === 'localhost' || req.ip === '127.0.0.1') {
      return next()
    }

    const decision = await httpArcjet.protect(req)

    if (decision.isDenied()) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    next()
  }
}