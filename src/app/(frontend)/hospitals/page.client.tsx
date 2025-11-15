'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { MapPin, Phone, Building2, Award, Navigation, Filter, X } from 'lucide-react'
import type { Hospital, HospitalNetwork, HospitalCapability } from '@/payload-types'

interface HospitalsClientProps {
  hospitals: Hospital[]
  capabilities: HospitalCapability[]
}

interface HospitalWithDistance extends Hospital {
  distance?: number // in miles
  eta?: number // in minutes
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Estimate ETA based on distance with tiered speed approach
// Shorter distances = slower (urban streets, traffic lights)
// Longer distances = faster (more highway/arterial roads)
function calculateETA(distanceInMiles: number): number {
  let averageSpeed: number
  
  if (distanceInMiles < 5) {
    averageSpeed = 35 // Urban streets, traffic lights, congestion
  } else if (distanceInMiles < 15) {
    averageSpeed = 45 // Mix of arterials and highways
  } else {
    averageSpeed = 55 // Mostly highways
  }
  
  return Math.round((distanceInMiles / averageSpeed) * 60) // convert to minutes
}

export function HospitalsClient({ hospitals, capabilities }: HospitalsClientProps) {
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Get user location on mobile
  useEffect(() => {
    if (!isMobile) return

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
          setLocationError(null)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setLocationError('Location access denied')
        },
      )
    } else {
      setLocationError('Geolocation not supported')
    }
  }, [isMobile])

  // Calculate distances and filter hospitals
  const processedHospitals = useMemo(() => {
    let processed: HospitalWithDistance[] = hospitals.map((hospital) => {
      const result: HospitalWithDistance = { ...hospital }

      // Calculate distance if we have user location and hospital coordinates
      if (isMobile && userLocation && hospital.latitude && hospital.longitude) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lon,
          hospital.latitude,
          hospital.longitude,
        )
        result.distance = distance
        result.eta = calculateETA(distance)
      }

      return result
    })

    // Filter by capabilities
    if (selectedCapabilities.length > 0) {
      processed = processed.filter((hospital) => {
        if (!hospital.capabilities || hospital.capabilities.length === 0) return false

        return selectedCapabilities.every((selectedCapId) =>
          hospital.capabilities?.some((cap) => {
            const capability = typeof cap.capability === 'object' ? cap.capability : null
            return capability?.id === selectedCapId
          }),
        )
      })
    }

    // Sort by distance on mobile if available
    if (isMobile && userLocation) {
      processed.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance
        }
        return 0
      })
    }

    return processed
  }, [hospitals, selectedCapabilities, userLocation, isMobile])

  const toggleCapability = (capabilityId: string) => {
    setSelectedCapabilities((prev) =>
      prev.includes(capabilityId)
        ? prev.filter((id) => id !== capabilityId)
        : [...prev, capabilityId],
    )
  }

  const clearFilters = () => {
    setSelectedCapabilities([])
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Hospital Directory
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Hospital information, contacts, and capabilities
          </p>
        </div>

        {/* Location Status (Mobile Only) */}
        {isMobile && (
          <div className="mb-4">
            {userLocation ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <Navigation className="h-4 w-4" />
                <span>Sorted by distance from your location</span>
              </div>
            ) : locationError ? (
              <div className="text-sm text-amber-600 dark:text-amber-400">
                {locationError} - showing all hospitals
              </div>
            ) : (
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Getting your location...
              </div>
            )}
          </div>
        )}

        {/* Filter Section */}
        <div className="mb-6">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="md:hidden w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-xl shadow-sm mb-4"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filter by Capability</span>
              {selectedCapabilities.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                  {selectedCapabilities.length}
                </span>
              )}
            </div>
          </button>

          {/* Filter Content */}
          <div
            className={`${filterOpen || !isMobile ? 'block' : 'hidden'} bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-xl shadow-sm p-4`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-neutral-500" />
                <span className="font-medium text-sm">Filter by Capability</span>
              </div>
              {selectedCapabilities.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {capabilities.map((capability) => {
                const isSelected = selectedCapabilities.includes(capability.id)
                return (
                  <button
                    key={capability.id}
                    onClick={() => toggleCapability(capability.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                    }`}
                  >
                    {capability.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          {processedHospitals.length} hospital{processedHospitals.length !== 1 ? 's' : ''} found
        </div>

        {/* Hospitals Grid */}
        {processedHospitals.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-2xl shadow-sm p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              No Hospitals Found
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {selectedCapabilities.length > 0
                ? 'Try adjusting your filters'
                : 'Hospital information will appear here when added.'}
            </p>
            {selectedCapabilities.length > 0 && (
              <button
                onClick={clearFilters}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedHospitals.map((hospital) => {
              const network =
                typeof hospital.network === 'object'
                  ? (hospital.network as HospitalNetwork)
                  : null

              return (
                <Link
                  key={hospital.id}
                  href={`/hospitals/${hospital.id}`}
                  className="bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Distance/ETA Badge (Mobile Only) */}
                  {isMobile && hospital.distance !== undefined && hospital.eta !== undefined && (
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                      <Navigation className="h-4 w-4" />
                      <span>
                        ETA {hospital.eta} min | {hospital.distance.toFixed(1)} mi
                      </span>
                    </div>
                  )}

                  {/* Hospital Name */}
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                    {hospital.name}
                  </h2>

                  {/* Network Badge */}
                  {network && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                        {network.name}
                      </span>
                    </div>
                  )}

                  {/* Address */}
                  {hospital.address && (
                    <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        {hospital.address.city && hospital.address.state && (
                          <div>
                            {hospital.address.city}, {hospital.address.state}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Squad Phone */}
                  {hospital.squadPhone && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <a
                        href={`tel:${hospital.squadPhone}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {hospital.squadPhone}
                      </a>
                    </div>
                  )}

                  {/* Capabilities Preview */}
                  {hospital.capabilities && hospital.capabilities.length > 0 && (
                    <div className="mt-auto pt-3 border-t dark:border-neutral-700">
                      <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                        <Award className="h-3.5 w-3.5" />
                        <span>Capabilities:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {hospital.capabilities.slice(0, 2).map((cap, idx) => {
                          const capability =
                            typeof cap.capability === 'object' ? cap.capability : null
                          if (!capability) return null

                          return (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 text-xs rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200"
                            >
                              {capability.name}
                              {cap.level && ` - ${cap.level}`}
                            </span>
                          )
                        })}
                        {hospital.capabilities.length > 2 && (
                          <span className="inline-block px-2 py-1 text-xs text-neutral-500 dark:text-neutral-400">
                            +{hospital.capabilities.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
