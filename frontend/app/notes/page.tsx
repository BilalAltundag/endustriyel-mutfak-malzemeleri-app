'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, StickyNote } from 'lucide-react'
import { notesApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface Note {
  id: number
  title?: string
  content: string
  date: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const response = await notesApi.getNotes({ limit: 100 })
      setNotes(response.data)
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        date: new Date(formData.date).toISOString(),
      }
      if (editingNote) {
        await notesApi.updateNote(editingNote.id, data)
      } else {
        await notesApi.createNote(data)
      }
      setShowForm(false)
      setEditingNote(null)
      setFormData({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
      })
      fetchNotes()
    } catch (error: any) {
      console.error('Error saving note:', error)
      alert(error.response?.data?.detail || 'Not kaydedilirken bir hata oluştu')
    }
  }

  const handleEdit = (note: Note) => {
    setEditingNote(note)
    setFormData({
      title: note.title || '',
      content: note.content,
      date: new Date(note.date).toISOString().split('T')[0],
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return

    try {
      await notesApi.deleteNote(id)
      fetchNotes()
    } catch (error: any) {
      console.error('Error deleting note:', error)
      alert(error.response?.data?.detail || 'Not silinirken bir hata oluştu')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notlar</h1>
            <p className="text-gray-600">Genel notlar ve hatırlatıcılar</p>
          </div>
          <Button
            onClick={() => {
              setShowForm(true)
              setEditingNote(null)
              setFormData({
                title: '',
                content: '',
                date: new Date().toISOString().split('T')[0],
              })
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Not
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingNote ? 'Not Düzenle' : 'Yeni Not'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlık (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İçerik *
                  </label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2"
                    rows={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingNote ? 'Güncelle' : 'Kaydet'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setEditingNote(null)
                      setFormData({
                        title: '',
                        content: '',
                        date: new Date().toISOString().split('T')[0],
                      })
                    }}
                  >
                    İptal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : notes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Henüz not eklenmemiş
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <Card key={note.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {note.title ? (
                        <CardTitle>{note.title}</CardTitle>
                      ) : (
                        <div className="flex items-center">
                          <StickyNote className="w-5 h-5 mr-2 text-gray-400" />
                          <CardTitle className="text-gray-500">Not</CardTitle>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(note.date).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(note)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}



