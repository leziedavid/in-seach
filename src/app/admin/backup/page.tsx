"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Folder, Loader2, ArchiveRestore } from "lucide-react"
import { getAdminBackupFolders, backupAdminFolder } from "@/api/api"
import { toast } from "sonner"
import { useTranslation } from "@/utils/langue/hooks"

interface BackupFolder {
  name: string
  fileCount: number
}

export default function AdminBackupPage() {
  const { t } = useTranslation()
  const [folders, setFolders] = useState<BackupFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingFolder, setDownloadingFolder] = useState<string | null>(null)

  useEffect(() => {
    fetchFolders()
  }, [])

  const fetchFolders = async () => {
    try {
      setLoading(true)
      const res = await getAdminBackupFolders()
      if (res.data) {
        setFolders(res.data)
      }
    } catch (error) {
      toast.error(t("admin.backup.error_load"))
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (folder: string) => {
    if (downloadingFolder) return

    try {
      setDownloadingFolder(folder)
      const res = await backupAdminFolder(folder)
      if (res.statusCode === 200 && res.data?.zipUrl) {
        const link = document.createElement("a")
        link.href = res.data.zipUrl
        link.download = `${folder}.zip`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(t("admin.backup.success_download"))
      } else {
        toast.error(res.message || t("admin.backup.error_download"))
      }
    } catch (error) {
      toast.error(t("admin.backup.error_download"))
    } finally {
      setDownloadingFolder(null)
    }
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-black tracking-tight">{t("admin.backup.title")}</h1>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders.map((folder) => {
            const isDownloading = downloadingFolder === folder.name
            return (
              <motion.button
                key={folder.name}
                onClick={() => handleDownload(folder.name)}
                disabled={!!downloadingFolder}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="relative">
                  <Folder className="w-16 h-16 text-sky-400 fill-sky-300/40" strokeWidth={1.5} />
                  <span className="absolute inset-0 flex items-center justify-center pt-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-background/90 shadow-sm">
                      {isDownloading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground" />
                      ) : (
                        <ArchiveRestore className="w-3.5 h-3.5 text-foreground" />
                      )}
                    </span>
                  </span>
                </div>
                <span className="font-semibold text-sm">
                  {folder.name} ({folder.fileCount})
                </span>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
