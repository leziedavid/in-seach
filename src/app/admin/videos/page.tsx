"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, MoreHorizontal, Trash2, Edit2, ExternalLink, Video, PlayCircle, Loader2, X } from "lucide-react"
import { getVideos, adminCreateVideo, adminUpdateVideo, adminDeleteVideo } from "@/api/api"
import { Video as IVideo } from "@/types/interface"
import { toast } from "sonner"

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<IVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<Partial<IVideo> | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const res = await getVideos()
      if (res.data) {
        setVideos(res.data)
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des vidéos")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette vidéo ?")) return
    try {
      await adminDeleteVideo(id)
      setVideos(videos.filter(v => v.id !== id))
      toast.success("Vidéo supprimée avec succès")
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentVideo?.title || !currentVideo?.youtubeUrl) return

    try {
      setIsSubmitting(true)
      if (currentVideo.id) {
        // Update
        const res = await adminUpdateVideo(currentVideo.id, currentVideo)
        if (res.data) {
          setVideos(videos.map(v => v.id === currentVideo.id ? res.data! : v))
          toast.success("Vidéo mise à jour")
        }
      } else {
        // Create
        const res = await adminCreateVideo(currentVideo)
        if (res.data) {
          setVideos([res.data, ...videos])
          toast.success("Vidéo ajoutée")
        }
      }
      setIsModalOpen(false)
      setCurrentVideo(null)
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredVideos = videos.filter(v =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.youtubeUrl.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openAddModal = () => {
    setCurrentVideo({ title: "", youtubeUrl: "", thumbnail: "" })
    setIsModalOpen(true)
  }

  const openEditModal = (video: IVideo) => {
    setCurrentVideo(video)
    setIsModalOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Gestion des Vidéos</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Gérez les vidéos de présentation de la homepage</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 w-5" />
          <span>Ajouter une vidéo</span>
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher une vidéo..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-zinc-500">Chargement des vidéos...</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Video className="w-12 h-12 text-zinc-300" />
              <p className="text-zinc-500">Aucune vidéo trouvée</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Aperçu</th>
                  <th className="px-6 py-4">Titre</th>
                  <th className="px-6 py-4">URL YouTube</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredVideos.map((video) => (
                  <tr key={video.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                        {video.thumbnail ? (
                          <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PlayCircle className="w-6 h-6 text-zinc-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-1">{video.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-500 truncate max-w-[200px]">{video.youtubeUrl}</span>
                        <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-zinc-500">{new Date(video.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(video)}
                          className="p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(video.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Ajout / Edition */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSubmitting && setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden">

              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="font-bold text-lg">{currentVideo?.id ? "Modifier la vidéo" : "Ajouter une vidéo"}</h3>
                <button disabled={isSubmitting} onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Titre de la vidéo</label>
                  <input required type="text" placeholder="Ex: DJAMKO : La Révolution..." className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none" value={currentVideo?.title || ""} onChange={(e) => setCurrentVideo({ ...currentVideo, title: e.target.value })} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">URL YouTube</label>
                  <input required type="url" placeholder="https://www.youtube.com/watch?v=..." className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none" value={currentVideo?.youtubeUrl || ""} onChange={(e) => setCurrentVideo({ ...currentVideo, youtubeUrl: e.target.value })} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">URL de la miniature (Thumbnail)</label>
                  <input type="url" placeholder="Laissez vide pour utiliser l'image par défaut de YouTube" className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none" value={currentVideo?.thumbnail || ""} onChange={(e) => setCurrentVideo({ ...currentVideo, thumbnail: e.target.value })} />
                  <p className="text-[10px] text-zinc-400 ml-1 italic">Note: Le système extraira automatiquement l'image YouTube si ce champ est vide (à venir).</p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" disabled={isSubmitting} onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50">
                    Annuler
                  </button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{currentVideo?.id ? "Mettre à jour" : "Ajouter"}</span>
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )

}
