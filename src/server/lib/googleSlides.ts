import type { SlideData } from '../../shared/types.js'

const SLIDES_API = 'https://slides.googleapis.com/v1/presentations'

interface BatchRequest {
  [key: string]: unknown
}

/**
 * Create a Google Slides presentation from structured slide data.
 * Returns the presentation URL.
 */
export async function createGooglePresentation(
  slides: SlideData[],
  title: string,
  googleToken: string
): Promise<string> {
  // Step 1: Create blank presentation
  const createRes = await fetch(SLIDES_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${googleToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  })

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}))
    if (createRes.status === 401) {
      throw new Error('google_reauth_needed')
    }
    throw new Error(`Failed to create presentation: ${err.error?.message || createRes.statusText}`)
  }

  const presentation = await createRes.json()
  const presentationId = presentation.presentationId

  // Step 2: Build batchUpdate requests for all slides
  const requests = buildBatchRequests(slides)

  // Delete the default blank slide that Google creates
  const defaultSlideId = presentation.slides?.[0]?.objectId
  if (defaultSlideId) {
    requests.push({ deleteObject: { objectId: defaultSlideId } })
  }

  if (requests.length > 0) {
    const batchRes = await fetch(`${SLIDES_API}/${presentationId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${googleToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    })

    if (!batchRes.ok) {
      const err = await batchRes.json().catch(() => ({}))
      throw new Error(`Failed to populate slides: ${err.error?.message || batchRes.statusText}`)
    }
  }

  return `https://docs.google.com/presentation/d/${presentationId}/edit`
}

/**
 * Map SlideData[] to Google Slides batchUpdate requests.
 * Uses TITLE_AND_BODY layout with placeholderIdMappings for clean output.
 */
function buildBatchRequests(slides: SlideData[]): BatchRequest[] {
  const requests: BatchRequest[] = []

  slides.forEach((slide, index) => {
    const slideObjectId = `slide_${index}`
    const titleId = `slide_${index}_title`
    const bodyId = `slide_${index}_body`

    // Choose layout based on slide type
    const layout = slide.type === 'title' || slide.type === 'closing'
      ? 'TITLE'
      : 'TITLE_AND_BODY'

    const placeholderMappings = layout === 'TITLE'
      ? [
          { layoutPlaceholder: { type: 'CENTERED_TITLE', index: 0 }, objectId: titleId },
          { layoutPlaceholder: { type: 'SUBTITLE', index: 0 }, objectId: bodyId },
        ]
      : [
          { layoutPlaceholder: { type: 'TITLE', index: 0 }, objectId: titleId },
          { layoutPlaceholder: { type: 'BODY', index: 0 }, objectId: bodyId },
        ]

    // Create the slide
    requests.push({
      createSlide: {
        objectId: slideObjectId,
        insertionIndex: index,
        slideLayoutReference: { predefinedLayout: layout },
        placeholderIdMappings: placeholderMappings,
      },
    })

    // Populate content based on slide type
    const { titleText, bodyText, addBullets } = getSlideContent(slide)

    if (titleText) {
      requests.push({
        insertText: {
          objectId: titleId,
          text: titleText,
          insertionIndex: 0,
        },
      })
    }

    if (bodyText) {
      requests.push({
        insertText: {
          objectId: bodyId,
          text: bodyText,
          insertionIndex: 0,
        },
      })

      if (addBullets) {
        requests.push({
          createParagraphBullets: {
            objectId: bodyId,
            bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE',
            textRange: { type: 'ALL' },
          },
        })
      }
    }
  })

  return requests
}

/**
 * Extract title and body text from a SlideData object.
 */
function getSlideContent(slide: SlideData): { titleText: string; bodyText: string; addBullets: boolean } {
  switch (slide.type) {
    case 'title':
      return {
        titleText: slide.heading,
        bodyText: [slide.subtitle, slide.author, slide.date].filter(Boolean).join('\n'),
        addBullets: false,
      }

    case 'content':
      return {
        titleText: slide.heading,
        bodyText: slide.bullets.join('\n'),
        addBullets: true,
      }

    case 'code':
      return {
        titleText: slide.heading,
        bodyText: slide.code + (slide.caption ? `\n\n${slide.caption}` : ''),
        addBullets: false,
      }

    case 'metrics':
      return {
        titleText: slide.heading || 'Key Metrics',
        bodyText: slide.stats.map(s => `${s.number} — ${s.label}`).join('\n'),
        addBullets: true,
      }

    case 'closing':
      return {
        titleText: slide.heading,
        bodyText: [
          slide.cta,
          ...(slide.links || []),
        ].filter(Boolean).join('\n'),
        addBullets: false,
      }
  }
}
