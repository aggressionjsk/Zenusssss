'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import Button from '../ui/button'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  username: string
}

const DeleteAccountModal = ({ isOpen, onClose, onConfirm, username }: DeleteAccountModalProps) => {
  const [confirmUsername, setConfirmUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    if (confirmUsername !== username) return
    
    setIsLoading(true)
    await onConfirm()
    setIsLoading(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-red-500 border-2 p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-500">Delete Account</DialogTitle>
          <DialogDescription className="text-white mt-2">
            This action cannot be undone. Your account, posts, comments, and all associated data will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="my-6">
          <p className="text-white mb-4">To confirm, please type your username: <span className="font-bold">{username}</span></p>
          <Input
            value={confirmUsername}
            onChange={(e) => setConfirmUsername(e.target.value)}
            placeholder="Enter your username"
            className="bg-neutral-900 border-neutral-700 text-white"
          />
        </div>

        <DialogFooter>
          <Button 
            label="Cancel" 
            onClick={onClose} 
            secondary 
            disabled={isLoading}
          />
          <Button 
            label="Delete Account" 
            onClick={handleConfirm} 
            danger 
            disabled={confirmUsername !== username || isLoading}
            isLoading={isLoading}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteAccountModal