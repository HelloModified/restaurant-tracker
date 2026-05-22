'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from './lib/supabase'
import styles from './page.module.css'

declare global {
  interface Window {
    google: any
  }
}

interface OrderedItem {
  id: string
  name: string
  tag: 'Drink' | 'Food' | 'Dessert' | 'Activity'
  price: number
  tasteRating: number
}

interface Visit {
  id: string
  date: string
  attendees: 'Dan' | 'Nick' | 'Dan & Nick' | 'A Party'
  mealType?: string
  priceTier: 'Cheap' | 'Fair' | 'Expensive'
  vibe: number
  service: number
  items: OrderedItem[]
}

interface DiscoveredPlace {
  id: number
  name: string
  location: string
  type: 'Food' | 'Fun'
  visits: Visit[]
  createdAt: string
}

interface DiscoveryPlace {
  id: number
  name: string
  location: string
  type: 'Food' | 'Fun'
  notes: string
  source?: string
  createdAt: string
}

export default function Home() {
  const [tab, setTab] = useState<'discovery' | 'discovered'>('discovery')
  const [discoveryPlaces, setDiscoveryPlaces] = useState<DiscoveryPlace[]>([])
  const [discoveredPlaces, setDiscoveredPlaces] = useState<DiscoveredPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlace, setSelectedPlace] = useState<DiscoveredPlace | null>(null)
  const [showNewVisitModal, setShowNewVisitModal] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [locationDropdownType, setLocationDropdownType] = useState<'discovery' | 'discovered' | null>(null)
  const [placeSuggestions, setPlaceSuggestions] = useState<any[]>([])
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false)
  const [placeDropdownType, setPlaceDropdownType] = useState<'discovery' | 'discovered' | null>(null)
  const autocompleteService = useRef<any>(null)
  const placesService = useRef<any>(null)

  const [discoveryForm, setDiscoveryForm] = useState({
    name: '',
    location: '',
    type: 'Food' as 'Food' | 'Fun',
    notes: '',
    source: '',
  })

  const [discoveredForm, setDiscoveredForm] = useState({
    name: '',
    location: '',
    type: 'Food' as 'Food' | 'Fun',
  })

  const [visitForm, setVisitForm] = useState({
    date: new Date().toISOString().split('T')[0],
    attendees: 'Dan & Nick' as 'Dan' | 'Nick' | 'Dan & Nick' | 'A Party',
    mealType: 'Dinner',
    priceTier: 'Fair' as 'Cheap' | 'Fair' | 'Expensive',
    vibe: 5,
    service: 5,
    items: [{ name: '', tag: 'Food' as const, price: 0, tasteRating: 5 }],
  })

  useEffect(() => {
    loadPlaces()
  }, [])

  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([])
      return
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      )
      const data = await response.json()
      setLocationSuggestions(data || [])
      setShowLocationDropdown(true)
    } catch (error) {
      console.error('Location search error:', error)
    }
  }

  const searchPlaces = async (query: string, type: 'discovery' | 'discovered') => {
    if (query.length < 2) {
      setPlaceSuggestions([])
      return
    }

    try {
      const response = await fetch(
        `/api/places?action=autocomplete&input=${encodeURIComponent(query)}`
      )
      const data = await response.json()
      
      if (data.predictions) {
        setPlaceSuggestions(data.predictions)
        setShowPlaceDropdown(true)
        setPlaceDropdownType(type)
      }
    } catch (error) {
      console.error('Place search error:', error)
    }
  }

  const selectPlace = async (prediction: any, type: 'discovery' | 'discovered') => {
    try {
      const response = await fetch(
        `/api/places?action=details&placeId=${prediction.place_id}`
      )
      const data = await response.json()
      
      if (data.result) {
        const placeName = data.result.name
        const address = data.result.formatted_address

        if (type === 'discovery') {
          setDiscoveryForm({
            ...discoveryForm,
            name: placeName,
            location: address,
          })
        } else {
          setDiscoveredForm({
            ...discoveredForm,
            name: placeName,
            location: address,
          })
        }

        setShowPlaceDropdown(false)
        setPlaceSuggestions([])
      }
    } catch (error) {
      console.error('Error fetching place details:', error)
    }
  }

  const loadPlaces = async () => {
    try {
      setLoading(true)
      const { data: discovery, error: discError } = await supabase
        .from('discovery')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: discovered, error: discvError } = await supabase
        .from('discovered')
        .select('*')
        .order('created_at', { ascending: false })

      if (discError) console.error('Discovery error:', discError)
      if (discvError) console.error('Discovered error:', discvError)

      setDiscoveryPlaces(discovery || [])
      setDiscoveredPlaces(discovered || [])
    } catch (error) {
      console.error('Error loading places:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDiscovery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!discoveryForm.name.trim()) return

    try {
      const { error } = await supabase.from('discovery').insert([
        {
          name: discoveryForm.name,
          location: discoveryForm.location,
          type: discoveryForm.type,
          notes: discoveryForm.notes,
          source: discoveryForm.source || null,
        },
      ])

      if (error) {
        console.error('Insert error:', error)
        throw error
      }
      setDiscoveryForm({ name: '', location: '', type: 'Food', notes: '', source: '' })
      loadPlaces()
    } catch (error) {
      console.error('Error adding discovery:', error)
    }
  }

  const handleAddDiscovered = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!discoveredForm.name.trim()) return

    try {
      const { error } = await supabase.from('discovered').insert([
        {
          name: discoveredForm.name,
          location: discoveredForm.location,
          type: discoveredForm.type,
          visits: [],
        },
      ])

      if (error) throw error
      setDiscoveredForm({ name: '', location: '', type: 'Food' })
      loadPlaces()
      setTab('discovered')
    } catch (error) {
      console.error('Error adding discovered:', error)
    }
  }

  const handleLogVisit = async () => {
    try {
      if (!selectedPlace) return

      const newVisit: Visit = {
        id: Date.now().toString(),
        date: visitForm.date,
        attendees: visitForm.attendees,
        mealType: visitForm.mealType,
        priceTier: visitForm.priceTier,
        vibe: visitForm.vibe,
        service: visitForm.service,
        items: visitForm.items
          .filter((item) => item.name.trim())
          .map((item) => ({
            ...item,
            id: Math.random().toString(),
          })),
      }

      const updatedVisits = [...(selectedPlace.visits || []), newVisit]

      const { error } = await supabase
        .from('discovered')
        .update({ visits: updatedVisits })
        .eq('id', selectedPlace.id)

      if (error) throw error
      setShowNewVisitModal(false)
      setVisitForm({
        date: new Date().toISOString().split('T')[0],
        attendees: 'Dan & Nick',
        mealType: 'Dinner',
        priceTier: 'Fair',
        vibe: 5,
        service: 5,
        items: [{ name: '', tag: 'Food', price: 0, tasteRating: 5 }],
      })
      loadPlaces()
    } catch (error) {
      console.error('Error logging visit:', error)
    }
  }

  const handleMoveToDiscovered = async (discoveryId: number) => {
    try {
      const place = discoveryPlaces.find((p) => p.id === discoveryId)
      if (!place) return

      await supabase.from('discovered').insert([
        {
          name: place.name,
          location: place.location,
          type: place.type,
          visits: [],
        },
      ])

      await supabase.from('discovery').delete().eq('id', discoveryId)
      loadPlaces()
    } catch (error) {
      console.error('Error moving to discovered:', error)
    }
  }

  const handleDeleteDiscovery = async (id: number) => {
    try {
      await supabase.from('discovery').delete().eq('id', id)
      loadPlaces()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const handleDeleteDiscovered = async (id: number) => {
    try {
      await supabase.from('discovered').delete().eq('id', id)
      setSelectedPlace(null)
      loadPlaces()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const getAggregateStats = (place: DiscoveredPlace) => {
    if (!place.visits || place.visits.length === 0) return null

    const allItems = place.visits.flatMap((v) => v.items)
    const avgTaste =
      allItems.length > 0
        ? (allItems.reduce((sum, item) => sum + item.tasteRating, 0) / allItems.length).toFixed(1)
        : 0

    const avgVibe = (place.visits.reduce((sum, v) => sum + v.vibe, 0) / place.visits.length).toFixed(1)
    const avgService = (place.visits.reduce((sum, v) => sum + v.service, 0) / place.visits.length).toFixed(1)

    return { avgTaste, avgVibe, avgService, totalVisits: place.visits.length }
  }

  if (loading) {
    return <div className={styles.container}>Loading...</div>
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Exploration & Discovery</span>
        <h1>Our Adventure List</h1>
        <p style={{ marginTop: '0.5rem', opacity: 0.75, fontSize: '15px' }}>
          Track restaurants and activities you discover together. No theater. Just rigor and fun.
        </p>
        <div className={styles.tabs}>
          <button
            className={tab === 'discovery' ? styles.tabActive : styles.tabInactive}
            onClick={() => setTab('discovery')}
          >
            Yet to Go {discoveryPlaces.length}
          </button>
          <button
            className={tab === 'discovered' ? styles.tabActive : styles.tabInactive}
            onClick={() => setTab('discovered')}
          >
            Been There {discoveredPlaces.length}
          </button>
        </div>
      </header>

      {tab === 'discovery' ? (
        <div className={styles.section}>
          <div className={styles.addForm}>
            <span className={styles.eyebrow}>Finding</span>
            <h2>Add a place to explore</h2>
            <form onSubmit={handleAddDiscovery}>
              <div className={styles.formRow}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Place name"
                    value={discoveryForm.name}
                    onChange={(e) => {
                      setDiscoveryForm({ ...discoveryForm, name: e.target.value })
                      setPlaceDropdownType('discovery')
                      searchPlaces(e.target.value, 'discovery')
                    }}
                    onFocus={() => discoveryForm.name && setShowPlaceDropdown(true)}
                    onBlur={() => setTimeout(() => setShowPlaceDropdown(false), 200)}
                    required
                  />
                  {showPlaceDropdown && placeDropdownType === 'discovery' && placeSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(245, 243, 238, 0.95)',
                      backdropFilter: 'blur(8px)',
                      border: '0.5px solid rgba(201, 209, 216, 0.5)',
                      borderRadius: '0 0 6px 6px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 100,
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                    }}>
                      {placeSuggestions.map((prediction, idx) => (
                        <button
                          key={idx}
                          type="button"
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '12px',
                            background: 'none',
                            border: 'none',
                            borderBottom: '0.5px solid #E8EDF0',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#E8EDF0')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          onClick={() => selectPlace(prediction, 'discovery')}
                        >
                          <div style={{ fontSize: '14px', fontWeight: 500, color: '#0F1724', marginBottom: '4px' }}>
                            {prediction.main_text}
                          </div>
                          <div style={{ fontSize: '12px', color: '#1D232B', opacity: 0.7 }}>
                            {prediction.secondary_text}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <select
                  value={discoveryForm.type}
                  onChange={(e) => setDiscoveryForm({ ...discoveryForm, type: e.target.value as 'Food' | 'Fun' })}
                >
                  <option value="Food">Food</option>
                  <option value="Fun">Fun</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Location or neighborhood"
                value={discoveryForm.location}
                onChange={(e) => {
                  setDiscoveryForm({ ...discoveryForm, location: e.target.value })
                  setLocationDropdownType('discovery')
                  searchLocations(e.target.value)
                }}
                onFocus={() => discoveryForm.location && setShowLocationDropdown(true)}
                onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
              />
              {showLocationDropdown && locationDropdownType === 'discovery' && locationSuggestions.length > 0 && (
                <div className={styles.locationDropdown}>
                  {locationSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={styles.locationOption}
                      onClick={() => {
                        setDiscoveryForm({
                          ...discoveryForm,
                          location: `${suggestion.name} ${suggestion.address || ''}`.trim(),
                        })
                        setShowLocationDropdown(false)
                        setLocationSuggestions([])
                      }}
                    >
                      <div className={styles.locationName}>{suggestion.name}</div>
                      <div className={styles.locationAddress}>{suggestion.address || suggestion.display_name}</div>
                    </button>
                  ))}
                </div>
              )}

              <textarea
                placeholder="Why interested? What have you heard?"
                value={discoveryForm.notes}
                onChange={(e) => setDiscoveryForm({ ...discoveryForm, notes: e.target.value })}
                rows={3}
              />

              <input
                type="text"
                placeholder="Yelp or Google URL (optional)"
                value={discoveryForm.source}
                onChange={(e) => setDiscoveryForm({ ...discoveryForm, source: e.target.value })}
              />

              <button type="submit" className={styles.primaryBtn}>
                Add to Yet to Go
              </button>
            </form>
          </div>

          {discoveryPlaces.length === 0 ? (
            <div className={styles.empty}>
              <p>No discoveries yet. Start exploring!</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {discoveryPlaces.map((place) => (
                <div key={place.id} className={styles.card}>
                  <h3>{place.name}</h3>
                  <p className={styles.location}>📍 {place.location}</p>
                  <span className={styles.badge}>{place.type}</span>
                  {place.notes && <p className={styles.notes}>"{place.notes}"</p>}
                  {place.source && (
                    <a href={place.source} target="_blank" rel="noopener noreferrer" className={styles.link}>
                      View source →
                    </a>
                  )}
                  <div className={styles.cardActions}>
                    <button onClick={() => handleMoveToDiscovered(place.id)} className={styles.primaryBtn}>
                      ✓ Been there!
                    </button>
                    <button onClick={() => handleDeleteDiscovery(place.id)} className={styles.dangerBtn}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.section}>
          {!selectedPlace ? (
            <>
              <div className={styles.addForm}>
                <span className={styles.eyebrow}>Visiting</span>
                <h2>Log a new visit</h2>
                <form onSubmit={handleAddDiscovered}>
                  <div className={styles.formRow}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="text"
                        placeholder="Place name"
                        value={discoveredForm.name}
                        onChange={(e) => {
                          setDiscoveredForm({ ...discoveredForm, name: e.target.value })
                          setPlaceDropdownType('discovered')
                          searchPlaces(e.target.value, 'discovered')
                        }}
                        onFocus={() => discoveredForm.name && setShowPlaceDropdown(true)}
                        onBlur={() => setTimeout(() => setShowPlaceDropdown(false), 200)}
                        required
                      />
                      {showPlaceDropdown && placeDropdownType === 'discovered' && placeSuggestions.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(245, 243, 238, 0.95)',
                          backdropFilter: 'blur(8px)',
                          border: '0.5px solid rgba(201, 209, 216, 0.5)',
                          borderRadius: '0 0 6px 6px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 100,
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                        }}>
                          {placeSuggestions.map((prediction, idx) => (
                            <button
                              key={idx}
                              type="button"
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '12px',
                                background: 'none',
                                border: 'none',
                                borderBottom: '0.5px solid #E8EDF0',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease',
                              }}
                              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#E8EDF0')}
                              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              onClick={() => selectPlace(prediction, 'discovered')}
                            >
                              <div style={{ fontSize: '14px', fontWeight: 500, color: '#0F1724', marginBottom: '4px' }}>
                                {prediction.main_text}
                              </div>
                              <div style={{ fontSize: '12px', color: '#1D232B', opacity: 0.7 }}>
                                {prediction.secondary_text}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <select
                      value={discoveredForm.type}
                      onChange={(e) => setDiscoveredForm({ ...discoveredForm, type: e.target.value as 'Food' | 'Fun' })}
                    >
                      <option value="Food">Food</option>
                      <option value="Fun">Fun</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    placeholder="Location"
                    value={discoveredForm.location}
                    onChange={(e) => {
                      setDiscoveredForm({ ...discoveredForm, location: e.target.value })
                      setLocationDropdownType('discovered')
                      searchLocations(e.target.value)
                    }}
                    onFocus={() => discoveredForm.location && setShowLocationDropdown(true)}
                    onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                  />
                  {showLocationDropdown && locationDropdownType === 'discovered' && locationSuggestions.length > 0 && (
                    <div className={styles.locationDropdown}>
                      {locationSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={styles.locationOption}
                          onClick={() => {
                            setDiscoveredForm({
                              ...discoveredForm,
                              location: `${suggestion.name} ${suggestion.address || ''}`.trim(),
                            })
                            setShowLocationDropdown(false)
                            setLocationSuggestions([])
                          }}
                        >
                          <div className={styles.locationName}>{suggestion.name}</div>
                          <div className={styles.locationAddress}>{suggestion.address || suggestion.display_name}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  <button type="submit" className={styles.primaryBtn}>
                    Create & Log Visit
                  </button>
                </form>
              </div>

              {discoveredPlaces.length === 0 ? (
                <div className={styles.empty}>
                  <p>No visited places yet. Move from Yet to Go or create a new entry!</p>
                </div>
              ) : (
                <div className={styles.grid}>
                  {discoveredPlaces.map((place) => {
                    const stats = getAggregateStats(place)
                    return (
                      <div
                        key={place.id}
                        className={styles.card}
                        onClick={() => setSelectedPlace(place)}
                        style={{ cursor: 'pointer' }}
                      >
                        <h3>{place.name}</h3>
                        <p className={styles.location}>📍 {place.location}</p>
                        <span className={styles.badge}>{place.type}</span>

                        {stats && (
                          <div className={styles.stats}>
                            <div>
                              <strong>{stats.totalVisits}</strong> visits
                            </div>
                            <div>⭐ Taste: {stats.avgTaste}</div>
                            <div>🎭 Vibe: {stats.avgVibe}</div>
                            <div>👥 Service: {stats.avgService}</div>
                          </div>
                        )}

                        <button className={styles.detailBtn} onClick={(e) => e.stopPropagation()}>
                          View Details →
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <div className={styles.detailView}>
              <button onClick={() => setSelectedPlace(null)} className={styles.backBtn}>
                ← Back
              </button>

              <h2>{selectedPlace.name}</h2>
              <p className={styles.location}>📍 {selectedPlace.location}</p>
              <button
                onClick={() => {
                  // Open in Apple Maps - for now using a generic maps search
                  window.location.href = `https://maps.apple.com/?q=${encodeURIComponent(selectedPlace.name + ' ' + selectedPlace.location)}`
                }}
                className={styles.primaryBtn}
                style={{ marginBottom: '1.5rem' }}
              >
                🗺️ Open in Maps
              </button>

              <div className={styles.detailColumns}>
                <div className={styles.column}>
                  <h3>Visits ({selectedPlace.visits?.length || 0})</h3>
                  <button
                    onClick={() => setShowNewVisitModal(true)}
                    className={styles.primaryBtn}
                    style={{ width: '100%', marginBottom: '1rem' }}
                  >
                    + Log a Visit
                  </button>

                  <div className={styles.visitsList}>
                    {selectedPlace.visits?.map((visit) => (
                      <div key={visit.id} className={styles.visitCard}>
                        <p className={styles.visitDate}>{visit.date}</p>
                        <p>👥 {visit.attendees}</p>
                        {visit.mealType && <p>🍽️ {visit.mealType}</p>}
                        <p>💰 {visit.priceTier}</p>
                        <p>🎭 Vibe: {visit.vibe}/10</p>
                        <p>👥 Service: {visit.service}/10</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.column}>
                  <h3>Items Ordered</h3>
                  <div className={styles.itemsList}>
                    {selectedPlace.visits && selectedPlace.visits.length > 0 ? (
                      selectedPlace.visits.flatMap((v) =>
                        v.items.map((item) => (
                          <div key={item.id} className={styles.itemCard}>
                            <p className={styles.itemName}>{item.name}</p>
                            <span className={styles.itemTag}>{item.tag}</span>
                            <p className={styles.itemPrice}>${item.price.toFixed(2)}</p>
                            <p>⭐ Taste: {item.tasteRating}/10</p>
                          </div>
                        ))
                      )
                    ) : (
                      <p className={styles.empty} style={{ padding: '1rem' }}>
                        No items logged yet
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.detailActions}>
                <button onClick={() => handleDeleteDiscovered(selectedPlace.id)} className={styles.dangerBtn}>
                  Delete this place
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showNewVisitModal && selectedPlace && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Log a visit to {selectedPlace.name}</h2>
              <button onClick={() => setShowNewVisitModal(false)} className={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div className={styles.visitForm}>
              <div>
                <label>📅 When?</label>
                <input
                  type="date"
                  value={visitForm.date}
                  onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })}
                />
              </div>

              <div>
                <label>👥 Who went?</label>
                <select
                  value={visitForm.attendees}
                  onChange={(e) => setVisitForm({ ...visitForm, attendees: e.target.value as any })}
                >
                  <option value="Dan">Dan</option>
                  <option value="Nick">Nick</option>
                  <option value="Dan & Nick">Dan & Nick</option>
                  <option value="A Party">A Party</option>
                </select>
              </div>

              {selectedPlace.type === 'Food' && (
                <div>
                  <label>🍽️ Meal type?</label>
                  <select
                    value={visitForm.mealType}
                    onChange={(e) => setVisitForm({ ...visitForm, mealType: e.target.value })}
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Happy Hour">Happy Hour</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Brunch">Brunch</option>
                  </select>
                </div>
              )}

              {selectedPlace.type === 'Fun' && (
                <div>
                  <label>🎯 What did you do?</label>
                  <textarea
                    value={visitForm.mealType}
                    onChange={(e) => setVisitForm({ ...visitForm, mealType: e.target.value })}
                    placeholder="Describe the activity..."
                    rows={2}
                  />
                </div>
              )}

              <div>
                <label>💰 Price tier?</label>
                <select
                  value={visitForm.priceTier}
                  onChange={(e) => setVisitForm({ ...visitForm, priceTier: e.target.value as any })}
                >
                  <option value="Cheap">Cheap</option>
                  <option value="Fair">Fair</option>
                  <option value="Expensive">Expensive</option>
                </select>
              </div>

              <div>
                <label>🎭 Vibe ({visitForm.vibe}/10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={visitForm.vibe}
                  onChange={(e) => setVisitForm({ ...visitForm, vibe: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <label>👥 Service ({visitForm.service}/10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={visitForm.service}
                  onChange={(e) => setVisitForm({ ...visitForm, service: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label>🍽️ What did you order?</label>
                  <button
                    type="button"
                    onClick={() => setVisitForm({ ...visitForm, items: [...visitForm.items, { name: '', tag: 'Food', price: 0, tasteRating: 5 }] })}
                    className={styles.addItemBtn}
                  >
                    + Add item
                  </button>
                </div>

                {visitForm.items.map((item, idx) => (
                  <div key={idx} className={styles.itemInput}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...visitForm.items]
                          newItems[idx].name = e.target.value
                          setVisitForm({ ...visitForm, items: newItems })
                        }}
                      />
                      <select
                        value={item.tag}
                        onChange={(e) => {
                          const newItems = [...visitForm.items]
                          newItems[idx].tag = e.target.value as any
                          setVisitForm({ ...visitForm, items: newItems })
                        }}
                      >
                        <option value="Food">Food</option>
                        <option value="Drink">Drink</option>
                        <option value="Dessert">Dessert</option>
                        <option value="Activity">Activity</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <div>
                        <label style={{ fontSize: '12px' }}>Price</label>
                        <input
                          type="number"
                          placeholder="$"
                          value={item.price || ''}
                          onChange={(e) => {
                            const newItems = [...visitForm.items]
                            newItems[idx].price = parseFloat(e.target.value) || 0
                            setVisitForm({ ...visitForm, items: newItems })
                          }}
                          step="0.50"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px' }}>Taste ({item.tasteRating}/10)</label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={item.tasteRating}
                          onChange={(e) => {
                            const newItems = [...visitForm.items]
                            newItems[idx].tasteRating = parseInt(e.target.value)
                            setVisitForm({ ...visitForm, items: newItems })
                          }}
                        />
                      </div>
                    </div>

                    {visitForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setVisitForm({ ...visitForm, items: visitForm.items.filter((_, i) => i !== idx) })}
                        className={styles.dangerBtn}
                        style={{ width: '100%' }}
                      >
                        Remove item
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={handleLogVisit} className={styles.primaryBtn} style={{ width: '100%' }}>
                ✓ Save Visit
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        <p>Complex exploration. Simple execution. Both of you, synced automatically.</p>
      </footer>
    </div>
  )
}
