'use client'

import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import styles from './page.module.css'

interface Item {
  name: string
  rating: number
  notes: string
}

interface Visit {
  id: number
  visitDate: string
  items: Item[]
  overallRating: number
  company: string
  atmosphere: string
  wouldReturn: boolean
  highlights: string
  pricePoint: string
  nextTime: string
}

interface Entry {
  id: number
  name: string
  type: string
  location: string
  notes: string
  cuisine?: string
  highlights?: string
  tips?: string
  visits: Visit[]
  lastVisited?: string
  createdAt: string
}

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState('added')

  const [formData, setFormData] = useState({
    name: '',
    type: 'restaurant',
    location: '',
    notes: '',
  })

  const [visitForm, setVisitForm] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    items: [{ name: '', rating: 5, notes: '' }],
    overallRating: 5,
    company: '',
    atmosphere: '',
    wouldReturn: true,
    highlights: '',
    pricePoint: '$$',
    nextTime: '',
  })

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error loading entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      setFormLoading(true)
      const { error } = await supabase.from('entries').insert([
        {
          name: formData.name,
          type: formData.type,
          location: formData.location,
          notes: formData.notes,
          visits: [],
        },
      ])

      if (error) throw error
      setFormData({ name: '', type: 'restaurant', location: '', notes: '' })
      loadEntries()
    } catch (error) {
      console.error('Error adding entry:', error)
    } finally {
      setFormLoading(false)
    }
  }

  const handleLogVisit = async (entryId: number) => {
    try {
      const entry = entries.find((e) => e.id === entryId)
      if (!entry) return

      const updatedVisits = [...(entry.visits || []), { ...visitForm, id: Date.now() }]

      const { error } = await supabase
        .from('entries')
        .update({
          visits: updatedVisits,
          last_visited: visitForm.visitDate,
        })
        .eq('id', entryId)

      if (error) throw error
      setExpandedCard(null)
      setVisitForm({
        visitDate: new Date().toISOString().split('T')[0],
        items: [{ name: '', rating: 5, notes: '' }],
        overallRating: 5,
        company: '',
        atmosphere: '',
        wouldReturn: true,
        highlights: '',
        pricePoint: '$$',
        nextTime: '',
      })
      loadEntries()
    } catch (error) {
      console.error('Error logging visit:', error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from('entries').delete().eq('id', id)
      if (error) throw error
      loadEntries()
    } catch (error) {
      console.error('Error deleting entry:', error)
    }
  }

  const handleAddItem = () => {
    setVisitForm({
      ...visitForm,
      items: [...visitForm.items, { name: '', rating: 5, notes: '' }],
    })
  }

  const handleRemoveItem = (idx: number) => {
    setVisitForm({
      ...visitForm,
      items: visitForm.items.filter((_, i) => i !== idx),
    })
  }

  const handleUpdateItem = (idx: number, field: string, value: any) => {
    const newItems = [...visitForm.items]
    newItems[idx] = { ...newItems[idx], [field]: value }
    setVisitForm({ ...visitForm, items: newItems })
  }

  const filteredEntries = entries
    .filter((e) => (filter === 'all' ? true : e.type === filter))
    .sort((a, b) => {
      if (sortBy === 'added') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'rating') return (b.visits?.length || 0) - (a.visits?.length || 0)
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })

  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className={styles.starRating}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={star <= value ? styles.starFilled : styles.starEmpty}
        >
          ★
        </button>
      ))}
    </div>
  )

  if (loading) {
    return <div className={styles.container}>Loading...</div>
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>📍 Our Discovery List</h1>
        <p>Save restaurants and activities to explore together</p>
      </header>

      <div className={styles.addForm}>
        <h2>➕ Add a new spot</h2>
        <form onSubmit={handleAddEntry}>
          <div className={styles.formRow}>
            <input
              type="text"
              placeholder="Name (required)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
              <option value="restaurant">🍽️ Restaurant</option>
              <option value="activity">🎯 Activity</option>
              <option value="cafe">☕ Café</option>
              <option value="bar">🍹 Bar</option>
              <option value="other">✨ Other</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Location or neighborhood"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />

          <textarea
            placeholder="Notes, cuisine type, what intrigues you..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
          />

          <button type="submit" disabled={formLoading}>
            {formLoading ? 'Adding...' : 'Add to list'}
          </button>
        </form>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterButtons}>
          {['all', 'restaurant', 'activity', 'cafe', 'bar'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={filter === cat ? styles.filterActive : styles.filterInactive}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="added">Newest first</option>
          <option value="rating">Most visited</option>
          <option value="name">A to Z</option>
        </select>
      </div>

      {filteredEntries.length === 0 ? (
        <div className={styles.empty}>
          <p>No {filter === 'all' ? 'items' : filter + 's'} yet. Start adding spots to explore!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredEntries.map((entry) => (
            <div key={entry.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>{entry.name}</h3>
                <button onClick={() => handleDelete(entry.id)} className={styles.deleteBtn}>
                  ✕
                </button>
              </div>

              {entry.location && <p className={styles.location}>📍 {entry.location}</p>}
              {entry.notes && <p className={styles.notes}>"{entry.notes}"</p>}

              {entry.visits && entry.visits.length > 0 && (
                <div className={styles.visitSummary}>
                  <p>📋 {entry.visits.length} visit{entry.visits.length !== 1 ? 's' : ''}</p>
                  {entry.visits.slice(-1).map((visit) => (
                    <div key={visit.id} className={styles.lastVisit}>
                      <div>{visit.visitDate}</div>
                      <div>⭐ Overall: {visit.overallRating}/5</div>
                      {visit.items.length > 0 && (
                        <div>Best: {visit.items.reduce((a, b) => a.rating > b.rating ? a : b).name}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => setExpandedCard(expandedCard === entry.id ? null : entry.id)} className={styles.logBtn}>
                ✏️ Log a visit
              </button>
            </div>
          ))}
        </div>
      )}

      {expandedCard && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Log your visit</h2>
              <button onClick={() => setExpandedCard(null)} className={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div className={styles.visitForm}>
              <div>
                <label>📅 When did you go?</label>
                <input
                  type="date"
                  value={visitForm.visitDate}
                  onChange={(e) => setVisitForm({ ...visitForm, visitDate: e.target.value })}
                />
              </div>

              <div>
                <label>👥 Who did you go with?</label>
                <input
                  type="text"
                  placeholder="e.g., Just us two, with friends, family..."
                  value={visitForm.company}
                  onChange={(e) => setVisitForm({ ...visitForm, company: e.target.value })}
                />
              </div>

              <div>
                <div className={styles.itemsHeader}>
                  <label>🍽️ What did you order?</label>
                  <button type="button" onClick={handleAddItem} className={styles.addItemBtn}>
                    + Add item
                  </button>
                </div>

                {visitForm.items.map((item, idx) => (
                  <div key={idx} className={styles.itemInput}>
                    <div className={styles.itemNameRow}>
                      <input
                        type="text"
                        placeholder="Dish name"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className={styles.removeItemBtn}
                      >
                        ✕
                      </button>
                    </div>
                    <div>
                      <label>How was it?</label>
                      <StarRating value={item.rating} onChange={(val) => handleUpdateItem(idx, 'rating', val)} />
                    </div>
                    <textarea
                      placeholder="Taste, texture, would you order again..."
                      value={item.notes}
                      onChange={(e) => handleUpdateItem(idx, 'notes', e.target.value)}
                      rows={3}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label>😊 Overall experience</label>
                <StarRating
                  value={visitForm.overallRating}
                  onChange={(val) => setVisitForm({ ...visitForm, overallRating: val })}
                />
              </div>

              <div>
                <label>💡 Atmosphere & vibe</label>
                <textarea
                  placeholder="Lighting, music, decor, noise level, service..."
                  value={visitForm.atmosphere}
                  onChange={(e) => setVisitForm({ ...visitForm, atmosphere: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <label>💰 Price point</label>
                <select value={visitForm.pricePoint} onChange={(e) => setVisitForm({ ...visitForm, pricePoint: e.target.value })}>
                  <option value="$">$ - Budget-friendly</option>
                  <option value="$$">$$ - Moderate</option>
                  <option value="$$$">$$$ - Upscale</option>
                  <option value="$$$$">$$$$ - Fine dining</option>
                </select>
              </div>

              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={visitForm.wouldReturn}
                    onChange={(e) => setVisitForm({ ...visitForm, wouldReturn: e.target.checked })}
                  />
                  Would you go back?
                </label>
              </div>

              <div>
                <label>⭐ Best part of the experience</label>
                <textarea
                  placeholder="What stood out most? Any special memories..."
                  value={visitForm.highlights}
                  onChange={(e) => setVisitForm({ ...visitForm, highlights: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <label>💡 Next time, try...</label>
                <textarea
                  placeholder="Dishes to order, timing to go, seating preferences..."
                  value={visitForm.nextTime}
                  onChange={(e) => setVisitForm({ ...visitForm, nextTime: e.target.value })}
                  rows={3}
                />
              </div>

              <button onClick={() => handleLogVisit(expandedCard)} className={styles.saveBtn}>
                ✓ Save visit
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        ℹ️ Your list and visit logs are shared between both of you. Changes sync automatically.
      </footer>
    </div>
  )
}
