"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      closeButton
      richColors
      theme="system"
      toastOptions={{
        classNames: {
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
          description: "text-muted-foreground",
          title: "text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
