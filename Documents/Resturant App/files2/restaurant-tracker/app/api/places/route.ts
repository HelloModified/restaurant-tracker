export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get('input')
  const action = searchParams.get('action')
  const placeId = searchParams.get('placeId')

  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    return Response.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    if (action === 'autocomplete' && input) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&components=country:us&location=28.5383,-81.3792&radius=50000`
      )
      const data = await response.json()
      return Response.json(data)
    }

    if (action === 'details' && placeId) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=name,formatted_address`
      )
      const data = await response.json()
      return Response.json(data)
    }

    return Response.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Places API error:', error)
    return Response.json({ error: 'API request failed' }, { status: 500 })
  }
}
