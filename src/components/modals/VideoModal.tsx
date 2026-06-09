"use client"

import React, { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Video as VideoIcon, ChevronLeft, ChevronRight } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import { getVideos } from "@/api/api"
import { Video } from "@/types/interface"

const LOCAL_VIDEOS: Video[] = [
  {
    id: "local-1",
    title: "DJAMKO : La Révolution du E-commerce",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "local-2",
    title: "Comment utiliser Djamko",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
]

export default function VideoModal() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [videos, setVideos] = useState<Video[]>(LOCAL_VIDEOS)
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, skipSnaps: false })

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSelect])

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await getVideos()
        if (response.data && response.data.length > 0) {
          setVideos(response.data)
        }
      } catch (error) {
        console.error("Failed to fetch videos, using fallback", error)
      } finally {
        setLoading(false)
      }
    }
    fetchVideos()
  }, [])

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev()
  const scrollNext = () => emblaApi && emblaApi.scrollNext()

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal()
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [])

  // Only show on homepage
  if (pathname !== "/") return null

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={openModal}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Regarder les vidéos de présentation"
      >
        <VideoIcon className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
      </motion.button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-[#1a1a1a] shadow-2xl border border-white/10"
            >
              {/* Premium Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">DJAMKO TV</span>
                  </div>
                  <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
                  <span className="text-[10px] text-white/40 truncate max-w-[300px] hidden sm:block uppercase tracking-tight">
                    {videos[selectedIndex]?.title || "DJAMKO : La Révolution du E-commerce..."}
                  </span>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-full bg-white/5 p-2 text-white/60 transition-all hover:bg-white/10 hover:text-white focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Slider / Carousel */}
              <div className="relative group">
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex">
                    {videos.map((video, index) => (
                      <div className="flex-[0_0_100%] min-w-0" key={video.id}>
                        <div className="aspect-video w-full bg-black relative">
                          {selectedIndex === index ? (
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube.com/embed/${getYoutubeId(video.youtubeUrl)}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
                              title={video.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              className="h-full w-full"
                            ></iframe>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                              {video.thumbnail && <img src={video.thumbnail} alt={video.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
                              <VideoIcon className="h-12 w-12 text-white/20" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={scrollPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white/70 backdrop-blur-md flex items-center justify-center hover:bg-black/60 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:outline-none"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white/70 backdrop-blur-md flex items-center justify-center hover:bg-black/60 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:outline-none"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>

              {/* Footer / Pagination Dots */}
              <div className="h-14 bg-[#1a1a1a] flex items-center justify-center gap-6">
                <button onClick={scrollPrev} className="text-white/20 hover:text-white/60 transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex gap-2">
                  {videos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => emblaApi && emblaApi.scrollTo(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${selectedIndex === index ? "w-8 bg-primary" : "w-1.5 bg-white/10"
                        }`}
                    />
                  ))}
                </div>
                <button onClick={scrollNext} className="text-white/20 hover:text-white/60 transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
