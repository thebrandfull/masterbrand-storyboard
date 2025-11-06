"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, Loader2 } from "lucide-react"
import { deleteBrand } from "@/lib/actions/brands"
import { useToast } from "@/hooks/use-toast"

interface DeleteBrandButtonProps {
  brandId: string
  brandName: string
}

export function DeleteBrandButton({ brandId, brandName }: DeleteBrandButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteBrand(brandId)

      if (result.success) {
        toast({
          title: "Brand deleted",
          description: `${brandName} has been successfully deleted.`,
        })
        router.push("/brands")
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to delete brand",
        })
        setIsDeleting(false)
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-white/10">
        <DialogHeader>
          <DialogTitle>Delete Brand</DialogTitle>
          <DialogDescription className="text-white/60">
            Are you sure you want to delete <strong className="text-white">{brandName}</strong>?
            This action cannot be undone and will permanently delete all associated content,
            topics, and generations.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Brand
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
