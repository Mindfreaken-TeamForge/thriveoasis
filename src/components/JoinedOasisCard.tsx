'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Bell, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import { themes } from '@/themes'

// Oasis interface: defines the structure of the oasis data object.
interface Oasis {
  id: string
  name: string
  type: string
  color: string
  imageUrl?: string
  isLocked?: boolean
  theme: string
  memberCount?: number
  alerts?: number
}

// Props interface for the JoinedOasisCard component.
interface JoinedOasisCardProps {
  oasis: Oasis // The oasis data to display
  onViewOasis: (oasisId: string) => void // Callback for when the 'View Oasis' button is clicked
}

// Shiny black button style
const shinyBlackButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
  color: '#fff',
  textShadow: '0 0 5px rgba(255,255,255,0.5)',
  boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
  border: 'none',
  transition: 'all 0.1s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.875rem',
  fontWeight: '500',
  padding: '0.5rem 1rem',
}

// Member counter style
const memberCounterStyle: React.CSSProperties = {
  background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
  color: '#fff',
  textShadow: '0 0 5px rgba(255,255,255,0.5)',
  boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
  border: 'none',
  transition: 'all 0.1s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: '500',
  padding: '0.25rem 0.5rem',
  borderRadius: '9999px',
}

// Functional React component that displays information about a joined oasis card.
const JoinedOasisCard: React.FC<JoinedOasisCardProps> = ({ oasis, onViewOasis }) => {
  // State to keep track of the active member count, starting with the provided count or 0
  const [memberCount, setMemberCount] = useState(oasis?.memberCount || 0)
  // Retrieve the theme colors based on the provided theme or default to 'Thrive Oasis(Default)'
  const themeColors = themes[oasis.theme as keyof typeof themes] || themes['Thrive Oasis(Default)']

  // Effect hook to listen for real-time member count updates from Firestore
  useEffect(() => {
    if (!oasis?.id) return // Exit if no oasis ID is provided

    // Reference to the Firestore members collection for this oasis
    const membersRef = collection(db, 'oasis', oasis.id, 'members')
    // Query to get only the members with an 'active' status
    const membersQuery = query(membersRef, where('status', '==', 'active'))

    // Listen for real-time updates to the active member count
    const unsubscribe = onSnapshot(
      membersQuery,
      (snapshot) => {
        setMemberCount(snapshot.docs.length) // Update member count based on snapshot
      },
      (error) => {
        console.error('Error getting members:', error) // Log any errors
      }
    )

    return () => unsubscribe() // Clean up the listener on component unmount
  }, [oasis?.id])

  // Fallback values for the oasis properties if they are missing
  const oasisName = oasis?.name || 'Unnamed Oasis' // Display name or default
  const oasisAlerts = oasis?.alerts || 0 // Number of alerts or 0
  const oasisType = Array.isArray(oasis?.type) ? oasis.type[0] : oasis?.type || 'Unknown' // Primary type or 'Unknown'
  const oasisImageUrl = oasis?.imageUrl // Image URL if available

  return (
    // Wrapper for the card with framer-motion for hover and tap animations
    <motion.div
      className="w-full max-w-md"
      whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${themeColors.accent}` }} // Scale and shadow on hover
      whileTap={{ scale: 0.98 }} // Slightly shrink on tap
    >
      <Card
        className="overflow-hidden relative rounded-lg transition-all duration-300"
        style={{
          backgroundColor: themeColors.primary, // Card background color from theme
          boxShadow: `0 0 20px ${themeColors.accent}`, // Card shadow with theme accent
          border: `3px solid ${themeColors.primary}`, // Card border with primary theme color
        }}
      >
        {/* Main content area of the card */}
        <CardContent className="p-6">
          {/* Section displaying the avatar and basic oasis info */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 flex-shrink-0">
              {/* Image for oasis avatar */}
              <AvatarImage src={oasisImageUrl} alt={oasisName} />
              {/* Fallback in case image is missing */}
              <AvatarFallback
                className="text-2xl font-bold"
                style={{
                  backgroundColor: themeColors.secondary,
                  color: themeColors.text,
                }}
              >
                {oasisName[0]} {/* First letter of oasis name */}
              </AvatarFallback>
            </Avatar>

            {/* Oasis name and type */}
            <div className="flex-grow min-w-0">
              <h3
                className="text-2xl font-bold truncate"
                title={oasisName}
                style={{ color: themeColors.text }}
              >
                {oasisName} {/* Display oasis name */}
              </h3>
              <div className="flex items-center mt-1 text-sm" style={{ color: themeColors.text }}>
                <span className="truncate mr-2">{oasisType} Oasis</span> {/* Display oasis type */}
                {/* Member count display */}
                <div style={memberCounterStyle}>
                  <Users size={12} />
                  <span className="ml-1 text-xs font-semibold">{memberCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts badge (if any alerts exist) */}
          {oasisAlerts > 0 && (
            <Badge variant="destructive" className="absolute top-4 right-4 flex items-center">
              <Bell size={14} className="mr-1" /> {/* Alert icon */}
              {oasisAlerts} {/* Number of alerts */}
            </Badge>
          )}
        </CardContent>

        {/* Footer with the 'View Oasis' button */}
        <CardFooter className="p-6 pt-0">
          <Button
            onClick={() => onViewOasis(oasis.id)} // Trigger onViewOasis callback with oasis ID
            className="w-full font-medium"
            style={shinyBlackButtonStyle} // Style applied from shinyBlackButtonStyle
          >
            View Oasis
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default JoinedOasisCard