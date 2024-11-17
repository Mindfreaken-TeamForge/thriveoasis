import { useState } from 'react';
import { Smile } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Emote } from '@/types/upload';
import { formatEmoteDisplay } from '@/types/upload';

interface ReactionPickerProps {
  onSelect: (emoji: string, isCustom?: boolean) => void;
  customEmotes?: Emote[];
  oasisName?: string;
}

const defaultEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export function ReactionPicker({ onSelect, customEmotes = [], oasisName = 'Community' }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-gray-800/50 hover:bg-gray-800">
          <Smile className="w-5 h-5" />
          <span className="text-xs">Add Reaction</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Tabs defaultValue="default">
          <TabsList className="w-full">
            <TabsTrigger value="default">Default</TabsTrigger>
            {customEmotes.length > 0 && (
              <TabsTrigger value="custom">{oasisName} Emotes</TabsTrigger>
            )}
          </TabsList>
          <div className="p-4">
            <TabsContent value="default" className="m-0">
              <div className="grid grid-cols-6 gap-2">
                {defaultEmojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onSelect(emoji);
                      setOpen(false);
                    }}
                    className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </TabsContent>
            {customEmotes.length > 0 && (
              <TabsContent value="custom" className="m-0">
                <div className="grid grid-cols-6 gap-2">
                  {customEmotes.map(emote => (
                    <button
                      key={emote.id}
                      onClick={() => {
                        onSelect(emote.id, true);
                        setOpen(false);
                      }}
                      className="hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded transition-colors group relative"
                      title={formatEmoteDisplay(emote)}
                    >
                      <img 
                        src={emote.url} 
                        alt={formatEmoteDisplay(emote)}
                        className="w-8 h-8 object-contain"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity rounded text-xs text-white">
                        :{emote.baseName}:
                      </span>
                    </button>
                  ))}
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}