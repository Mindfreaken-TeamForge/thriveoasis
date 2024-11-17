"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, Trash2, Info, X } from 'lucide-react'
import { Checkbox } from "@/components/ui/checkbox"
import type { Emote } from '@/types/upload'
import { formatEmoteDisplay } from '@/types/upload'

interface EmotesSectionProps {
  emotes: Emote[];
  totalEmoteLimit: number;
  BASE_SLOTS: number;
  isPremium: boolean;
  extraSlots: number;
  SLOTS_PER_DOLLAR: number;
  isUploadingEmote: boolean;
  handleEmoteUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleBulkDelete: () => void;
  handleSingleDelete: (emoteId: string) => void;
  selectedEmotes: string[];
  setSelectedEmotes: (emotes: string[]) => void;
  bulkDeleteMode: boolean;
  setBulkDeleteMode: (mode: boolean) => void;
}

export default function EmotesSection({
  emotes,
  totalEmoteLimit,
  BASE_SLOTS,
  isPremium,
  extraSlots,
  SLOTS_PER_DOLLAR,
  isUploadingEmote,
  handleEmoteUpload,
  handleBulkDelete,
  handleSingleDelete,
  selectedEmotes,
  setSelectedEmotes,
  bulkDeleteMode,
  setBulkDeleteMode,
}: EmotesSectionProps) {
  const remainingPurchasableSlots = totalEmoteLimit - BASE_SLOTS - extraSlots

  return (
    <Card className="w-full bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              Community Emotes
            </CardTitle>
            <span className="text-sm px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
              {emotes.length} / {totalEmoteLimit}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UploadButton
              isUploadingEmote={isUploadingEmote}
              handleEmoteUpload={handleEmoteUpload}
              disabled={emotes.length >= totalEmoteLimit}
            />
            {emotes.length > 0 && (
              <Button
                variant={bulkDeleteMode ? "destructive" : "outline"}
                onClick={() => setBulkDeleteMode(!bulkDeleteMode)}
                className="text-sm py-1 px-2"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {bulkDeleteMode ? 'Cancel' : 'Bulk Delete'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <Progress value={(emotes.length / totalEmoteLimit) * 100} className="w-full h-1.5" />
          <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
            <div className="flex items-center gap-4">
              <SlotInfo color="blue" label={`Base ${isPremium ? 'Premium' : 'Free'}`} value={BASE_SLOTS} />
              {extraSlots > 0 && (
                <SlotInfo color="green" label="Purchased" value={extraSlots} />
              )}
            </div>
            <div className="flex items-center gap-4">
              {!isPremium && remainingPurchasableSlots > 0 && (
                <PurchaseOption
                  color="emerald"
                  label={`Buy ${SLOTS_PER_DOLLAR} for $1`}
                  subLabel={`(max ${remainingPurchasableSlots})`}
                />
              )}
              {!isPremium && (
                <PurchaseOption
                  color="purple"
                  label="Upgrade to Premium"
                  subLabel={`+${3000 - totalEmoteLimit} slots`}
                />
              )}
            </div>
          </div>
          <UploadRules />

          {/* Add bulk delete action banner */}
          {bulkDeleteMode && selectedEmotes.length > 0 && (
            <div className="flex items-center justify-between p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <span className="text-sm text-red-400">
                {selectedEmotes.length} emotes selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </Button>
            </div>
          )}

          {/* Emotes Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mt-6">
            {emotes.map((emote) => (
              <div 
                key={emote.id} 
                className={`relative group p-3 rounded-lg transition-all duration-200 ${
                  bulkDeleteMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-800/30'
                } border border-transparent hover:border-gray-700`}
              >
                {bulkDeleteMode ? (
                  <Checkbox
                    checked={selectedEmotes.includes(emote.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedEmotes([...selectedEmotes, emote.id]);
                      } else {
                        setSelectedEmotes(selectedEmotes.filter(id => id !== emote.id));
                      }
                    }}
                    className="absolute top-2 left-2 z-10"
                  />
                ) : (
                  <button
                    onClick={() => handleSingleDelete(emote.id)}
                    className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <img
                  src={emote.url}
                  alt={formatEmoteDisplay(emote)}
                  className="w-12 h-12 object-contain bg-black/20 rounded-lg mx-auto"
                />
                <div className="text-xs text-center mt-2 space-y-0.5">
                  <p className="text-gray-300 font-medium">:{emote.baseName}:</p>
                  <p className="text-gray-500 text-[10px]">{emote.uniqueId}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper Components
function SlotInfo({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-1.5 w-1.5 rounded-full bg-${color}-500`} />
      <span className="text-gray-300">
        {label}: <span className="font-medium text-white">{value}</span>
      </span>
    </div>
  )
}

function PurchaseOption({ color, label, subLabel }: { color: string; label: string; subLabel: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-1.5 w-1.5 rounded-full bg-${color}-500`} />
      <span className={`text-${color}-400`}>
        {label} <span className="text-gray-400">{subLabel}</span>
      </span>
    </div>
  )
}

function UploadRules() {
  return (
    <div className="flex items-start gap-2 text-xs bg-gray-800/50 rounded p-2 border border-gray-700">
      <Info className="w-4 h-4 text-yellow-500 mt-0.5" />
      <div>
        <h4 className="font-medium text-white mb-1">Upload Requirements</h4>
        <ul className="space-y-0.5 text-gray-300">
          <li>Max size: 256KB</li>
          <li>Max dimensions: 128x128px</li>
          <li>Format: PNG, JPG, GIF</li>
        </ul>
      </div>
    </div>
  )
}

function UploadButton({ isUploadingEmote, handleEmoteUpload, disabled }: {
  isUploadingEmote: boolean;
  handleEmoteUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}) {
  return (
    <div className="relative">
      <input
        type="file"
        id="emote-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept="image/*"
        onChange={handleEmoteUpload}
        disabled={isUploadingEmote || disabled}
        onClick={(e) => {
          (e.target as HTMLInputElement).value = '';
        }}
      />
      <Button 
        className="flex items-center gap-2 relative pointer-events-none"
        disabled={isUploadingEmote || disabled}
        style={{
          background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
          color: '#fff',
          textShadow: '0 0 5px rgba(255,255,255,0.5)',
          boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
          border: 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <Upload className="w-4 h-4" />
        {isUploadingEmote ? 'Uploading...' : 'Upload'}
      </Button>
    </div>
  );
} 