"use client"

import { useCallback, useSyncExternalStore } from "react"

type Listener = () => void

const listeners = new Set<Listener>()
let currentBrandId = ""

function readFromStorage() {
  if (typeof window === "undefined") return
  const stored = window.localStorage.getItem("activeBrandId")
  if (stored) {
    currentBrandId = stored
  }
}

if (typeof window !== "undefined") {
  readFromStorage()
}

function emitChange() {
  listeners.forEach((listener) => {
    try {
      listener()
    } catch (error) {
      console.error("Brand selection listener failed", error)
    }
  })
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return currentBrandId
}

function getServerSnapshot() {
  return ""
}

function updateBrandId(nextId: string) {
  if (currentBrandId === nextId) {
    return
  }

  currentBrandId = nextId

  if (typeof window !== "undefined") {
    if (nextId) {
      window.localStorage.setItem("activeBrandId", nextId)
    } else {
      window.localStorage.removeItem("activeBrandId")
    }
    window.dispatchEvent(new CustomEvent("brand:selected", { detail: { brandId: nextId } }))
  }

  emitChange()
}

export function useBrandSelection() {
  const selectedBrandId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const setSelectedBrandId = useCallback((nextId: string) => {
    updateBrandId(nextId)
  }, [])

  return {
    selectedBrandId,
    setSelectedBrandId,
  }
}

export function getSelectedBrandId() {
  return currentBrandId
}

export function setSelectedBrandId(nextId: string) {
  updateBrandId(nextId)
}
