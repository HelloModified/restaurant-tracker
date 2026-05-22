export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get('input')
  const action = searchParams.get('action')
  const placeId = searchParams.get('placeId')

  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  console.log('=== PLACES API ROUTE ===')
  console.log('Action:', action)
  console.log('Input:', input)
  console.log('API Key exists:', !!apiKey)
  console.log('API Key length:', apiKey?.length)
  console.log('API Key starts with:', apiKey?.substring(0, 10))

  if (!apiKey) {
    console.error('ERROR: API key not configured in environment')
    return Response.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    if (action === 'autocomplete' && input) {
      console.log('Making autocomplete request...')
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&components=country:us&location=28.5383,-81.3792&radius=50000`
      console.log('URL (masked key):', url.replace(apiKey, '***'))
      
      const response = await fetch(url)
      console.log('Response status:', response.status)
      
      const data = await response.json()
      console.log('Response data:', data)
      return Response.json(data)
    }

    if (action === 'details' && placeId) {
      console.log('Making details request...')
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=name,formatted_address`
      )
      const data = await response.json()
      return Response.json(data)
    }

    return Response.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Places API error:', error)
    return Response.json({ error: 'API request failed', details: String(error) }, { status: 500 })
  }
}
