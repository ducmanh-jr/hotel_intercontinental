import { useEffect, useRef, useState } from 'react'
import { message } from 'antd'

export interface InteractiveHotelMapProps {
  latitude: number | undefined
  longitude: number | undefined
  hotelName: string
  cityName?: string
  onChangeCoordinates: (coords: { lat: number; lng: number }) => void
}

const CITY_COORDINATES: Record<string, [number, number]> = {
  'đà nẵng': [16.054407, 108.202167],
  'da nang': [16.054407, 108.202167],
  'hà nội': [21.028511, 105.854444],
  'ha noi': [21.028511, 105.854444],
  'hồ chí minh': [10.776889, 106.700806],
  'ho chi minh': [10.776889, 106.700806],
  'sài gòn': [10.776889, 106.700806],
  'nha trang': [12.238791, 109.196749],
  'phú quốc': [10.289879, 103.984020],
  'đà lạt': [11.940419, 108.458313],
  'quảng nam': [15.880058, 108.338047],
  'hội an': [15.880058, 108.338047],
  'huế': [16.463713, 107.590866],
  'vũng tàu': [10.345990, 107.084260],
  'hải phòng': [20.844912, 106.688084],
  'cần thơ': [10.045162, 105.746857],
}

// 100% Free tile providers that require NO API KEY and do NOT block localhost
const TILE_LAYERS = {
  streets: {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    subdomains: 'ab',
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors, Humanitarian OpenStreetMap Team',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdomains: 'abc',
    maxZoom: 18,
    attribution: '&copy; Esri &mdash; Satellite Imagery',
  },
}

export function InteractiveHotelMap({
  latitude,
  longitude,
  hotelName,
  cityName,
  onChangeCoordinates,
}: InteractiveHotelMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tileLayerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null)

  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets')
  const [showMarker, setShowMarker] = useState(true)
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isClientLoaded, setIsClientLoaded] = useState(false)

  // Initialize Leaflet map dynamically in client environment only
  useEffect(() => {
    if (typeof window === 'undefined') return
    let isMounted = true

    async function initLeaflet() {
      try {
        const L = (await import('leaflet')).default
        await import('leaflet/dist/leaflet.css')

        if (!isMounted || !mapContainerRef.current) return
        if (mapInstanceRef.current) return

        const initialLat = latitude ?? 16.054407
        const initialLng = longitude ?? 108.202167

        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 14,
          minZoom: 4,
          maxZoom: 19,
          scrollWheelZoom: true,
          zoomControl: true,
        })

        // Standard Humanitarian OpenStreetMap Layer (Free, no API key, no watermark)
        const activeTileConfig = TILE_LAYERS[mapType]
        const tileLayer = L.tileLayer(activeTileConfig.url, {
          subdomains: activeTileConfig.subdomains,
          maxZoom: activeTileConfig.maxZoom,
          attribution: activeTileConfig.attribution,
        }).addTo(map)
        tileLayerRef.current = tileLayer

        // Custom Teal Marker Icon
        const markerIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div class="map-pin" style="position: relative; transform: translate(-50%, -100%);">
              <div class="map-pin-pulse"></div>
              <div class="map-pin-label">${hotelName ? hotelName.slice(0, 18) : 'Vị trí khách sạn'}</div>
              <svg class="map-pin-svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        })

        const marker = L.marker([initialLat, initialLng], {
          icon: markerIcon,
          draggable: true,
        }).addTo(map)

        // Handle Map Click to relocate marker & update coordinates
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.on('click', (e: any) => {
          const lat = Number(e.latlng.lat.toFixed(6))
          const lng = Number(e.latlng.lng.toFixed(6))
          marker.setLatLng([lat, lng])
          if (!map.hasLayer(marker)) {
            marker.addTo(map)
            setShowMarker(true)
          }
          onChangeCoordinates({ lat, lng })
          void message.success(`Đã chọn tọa độ: ${lat}° N, ${lng}° E`)
        })

        // Handle Marker Drag
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        marker.on('dragend', (e: any) => {
          const pos = e.target.getLatLng()
          const lat = Number(pos.lat.toFixed(6))
          const lng = Number(pos.lng.toFixed(6))
          onChangeCoordinates({ lat, lng })
          void message.success(`Đã ghim tọa độ mới: ${lat}° N, ${lng}° E`)
        })

        // Live cursor coordinates tracking
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.on('mousemove', (e: any) => {
          if (!isMounted) return
          setHoverCoords({
            lat: Number(e.latlng.lat.toFixed(6)),
            lng: Number(e.latlng.lng.toFixed(6)),
          })
        })

        map.on('mouseout', () => {
          if (!isMounted) return
          setHoverCoords(null)
        })

        mapInstanceRef.current = map
        markerRef.current = marker
        setIsClientLoaded(true)
      } catch (err) {
        console.error('Không thể tải Leaflet Map:', err)
      }
    }

    void initLeaflet()

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
        tileLayerRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Switch between Street map and Satellite map
  const handleChangeMapType = async (newType: 'streets' | 'satellite') => {
    setMapType(newType)
    if (!mapInstanceRef.current) return

    try {
      const L = (await import('leaflet')).default
      if (tileLayerRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current)
      }

      const cfg = TILE_LAYERS[newType]
      const newLayer = L.tileLayer(cfg.url, {
        subdomains: cfg.subdomains,
        maxZoom: cfg.maxZoom,
        attribution: cfg.attribution,
      }).addTo(mapInstanceRef.current)

      tileLayerRef.current = newLayer
      void message.info(`Đã chuyển sang ${newType === 'satellite' ? 'Ảnh vệ tinh' : 'Bản đồ đường phố'}.`)
    } catch (e) {
      console.error('Lỗi khi đổi lớp bản đồ:', e)
    }
  }

  // Toggle Marker visibility
  const handleToggleMarker = () => {
    if (!mapInstanceRef.current || !markerRef.current) return
    if (showMarker) {
      mapInstanceRef.current.removeLayer(markerRef.current)
      setShowMarker(false)
      void message.info('Đã ẩn con trỏ ghim trên bản đồ.')
    } else {
      markerRef.current.addTo(mapInstanceRef.current)
      setShowMarker(true)
      void message.info('Đã hiển thị con trỏ ghim.')
    }
  }

  // Sync external coordinates changes to marker & map
  useEffect(() => {
    if (markerRef.current && latitude != null && longitude != null) {
      const cur = markerRef.current.getLatLng()
      if (Math.abs(cur.lat - latitude) > 0.00001 || Math.abs(cur.lng - longitude) > 0.00001) {
        markerRef.current.setLatLng([latitude, longitude])
      }
    }
  }, [latitude, longitude])

  // Fly to city center and bound map when selected city changes
  useEffect(() => {
    if (!mapInstanceRef.current || !cityName) return
    const norm = cityName.toLowerCase()

    for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
      if (norm.includes(key)) {
        mapInstanceRef.current.flyTo(coords, 13, { duration: 1.2 })
        break
      }
    }
  }, [cityName])

  // Controls
  const handleZoomVietnam = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([16.0, 107.0], 6)
      void message.info('Đã thu nhỏ: Toàn cảnh lãnh thổ Việt Nam.')
    }
  }

  const handleZoomCity = () => {
    if (mapInstanceRef.current) {
      if (cityName) {
        const norm = cityName.toLowerCase()
        const target = Object.entries(CITY_COORDINATES).find(([k]) => norm.includes(k))
        if (target) {
          mapInstanceRef.current.setView(target[1], 13)
          void message.info(`Đã định vị: Khu vực ${cityName}.`)
          return
        }
      }
      if (latitude != null && longitude != null) {
        mapInstanceRef.current.setView([latitude, longitude], 13)
        void message.info('Đã định vị: Khu vực thành phố.')
      }
    }
  }

  const handleZoomStreet = () => {
    if (mapInstanceRef.current && latitude != null && longitude != null) {
      mapInstanceRef.current.setView([latitude, longitude], 17)
      void message.info('Đã phóng to: Chi tiết số nhà, ngõ ngách.')
    }
  }

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      void message.warning('Trình duyệt không hỗ trợ định vị GPS.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6))
        const lng = Number(pos.coords.longitude.toFixed(6))
        onChangeCoordinates({ lat, lng })

        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
          if (!mapInstanceRef.current.hasLayer(markerRef.current)) {
            markerRef.current.addTo(mapInstanceRef.current)
            setShowMarker(true)
          }
          mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.5 })
        }
        void message.success(`Đã lấy vị trí GPS thực tế: ${lat}° N, ${lng}° E`)
      },
      (err) => {
        void message.error(`Không thể lấy vị trí GPS: ${err.message}`)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* Top Map Toolbar: Redesigned cleanly with clear grouping */}
      <div className="flex items-center justify-between flex-wrap gap-2.5 p-2 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Group 1: Zoom Levels */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11.5px] font-semibold text-[#64748b]">Thu phóng:</span>
            <div className="inline-flex rounded-lg border border-[#cbd5e1] bg-white p-0.5 shadow-xs">
              <button
                type="button"
                className="px-2.5 py-1 text-xs font-semibold rounded-md text-[#334155] hover:text-[#0b5f53] hover:bg-[#f1f5f9] transition-all cursor-pointer"
                onClick={handleZoomVietnam}
              >
                Toàn quốc
              </button>
              <button
                type="button"
                className="px-2.5 py-1 text-xs font-semibold rounded-md text-[#334155] hover:text-[#0b5f53] hover:bg-[#f1f5f9] transition-all cursor-pointer"
                onClick={handleZoomCity}
              >
                Thành phố
              </button>
              <button
                type="button"
                className="px-2.5 py-1 text-xs font-semibold rounded-md text-[#334155] hover:text-[#0b5f53] hover:bg-[#f1f5f9] transition-all cursor-pointer"
                onClick={handleZoomStreet}
              >
                Chi tiết
              </button>
            </div>
          </div>

          <div className="h-4 w-px bg-[#cbd5e1] hidden sm:block" />

          {/* Group 2: Map Layer Display Mode */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11.5px] font-semibold text-[#64748b]">Hiển thị:</span>
            <div className="inline-flex rounded-lg border border-[#cbd5e1] bg-white p-0.5 shadow-xs">
              <button
                type="button"
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  mapType === 'streets'
                    ? 'bg-[#0b5f53] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#0b5f53] hover:bg-[#f1f5f9]'
                }`}
                onClick={() => void handleChangeMapType('streets')}
              >
                🗺️ Bản đồ
              </button>
              <button
                type="button"
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  mapType === 'satellite'
                    ? 'bg-[#0b5f53] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#0b5f53] hover:bg-[#f1f5f9]'
                }`}
                onClick={() => void handleChangeMapType('satellite')}
              >
                🛰️ Vệ tinh
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls: Pin Visibility Toggle & GPS Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-xs ${
              showMarker
                ? 'bg-white border-[#cbd5e1] text-[#475569] hover:bg-slate-50'
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}
            onClick={handleToggleMarker}
            title={showMarker ? 'Nhấp để ẩn ghim' : 'Nhấp để hiện ghim'}
          >
            <span>{showMarker ? '📍 Ẩn ghim' : '📍 Hiện ghim'}</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#0b5f53] bg-white hover:bg-[#ecfdf5] border border-[#a7f3d0] rounded-lg shadow-xs cursor-pointer transition-all"
            onClick={handleGetGPS}
          >
            <span>📍 GPS thiết bị</span>
          </button>
        </div>
      </div>

      {/* Main Map Frame */}
      <div
        ref={mapContainerRef}
        className="map-frame"
        style={{ minHeight: '340px', height: '340px', position: 'relative' }}
        role="region"
        aria-label="Bản đồ tương tác toàn quốc OpenStreetMap"
      >
        {/* Initial SSR / Loading Placeholder */}
        {!isClientLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#edf5f2] text-center p-4">
            <span className="text-sm font-semibold text-[#0b5f53] mb-1">
              Đang tải bản đồ tương tác toàn quốc...
            </span>
            <span className="text-xs text-muted">
              Hỗ trợ lăn chuột để phóng to/thu nhỏ và kéo để chọn mọi khu vực trên toàn quốc.
            </span>
          </div>
        )}

        {/* Live Cursor Coordinate HUD Badge (Bottom Left) */}
        <div className="map-hint-pill font-mono">
          {hoverCoords ? (
            <span className="text-[#0b5f53] font-semibold">
              🎯 Trỏ chuột: {hoverCoords.lat.toFixed(6)}° N, {hoverCoords.lng.toFixed(6)}° E
            </span>
          ) : (
            <span>🖱️ Lăn chuột để thu phóng, kéo để di chuyển vùng, nhấp để ghim</span>
          )}
        </div>

        {/* Locked Pinned Coordinates (Bottom Right) */}
        <div className="map-coords-badge font-mono">
          📍 Đã ghim: {latitude != null ? `${Number(latitude).toFixed(6)}° N` : '16.054407° N'},{' '}
          {longitude != null ? `${Number(longitude).toFixed(6)}° E` : '108.202167° E'}
        </div>
      </div>

      <span className="form-help">
        Lăn chuột để phóng to/thu nhỏ, nhấp hoặc kéo thả ghim đến vị trí chính xác của khách sạn trên bản đồ.
      </span>
    </div>
  )
}
