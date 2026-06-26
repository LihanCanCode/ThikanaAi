"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { getWalkingRoute } from "@/lib/mapbox";
import { UNIVERSITIES } from "@/lib/utils";
import type { Listing } from "@/types";

interface ListingMapProps {
  listings: Listing[];
  selectedUniversityId?: string;
  activeListingId?: string | null;
  onSelectListing?: (id: string) => void;
}

export default function ListingMap({
  listings,
  selectedUniversityId,
  activeListingId,
  onSelectListing,
}: ListingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const univMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMins: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!token) return; // Do not initialize mapbox if token is missing

    mapboxgl.accessToken = token;

    const initialCenter: [number, number] = [90.3989, 23.7279]; // Dhaka center

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialCenter,
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      // Add source for route line
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        },
      });

      // Add layer for route line
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#2A7D46", // Our primary sage green
          "line-width": 5,
          "line-opacity": 0.85,
        },
      });
      setMapLoaded(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [token]);

  // Update listings markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    listings.forEach((listing) => {
      if (listing.lat && listing.lng) {
        // House marker — green pill with label
        const el = document.createElement("div");
        el.style.cssText = [
          "display:flex","align-items:center","gap:4px",
          "background:#1a7a3c","color:#fff",
          "padding:5px 10px","border-radius:999px",
          "font-size:12px","font-weight:700",
          "box-shadow:0 2px 8px rgba(0,0,0,0.3)",
          "border:2px solid #fff",
          "cursor:pointer",
          "white-space:nowrap",
          listing.id === activeListingId ? "transform:scale(1.1);z-index:10" : "",
        ].join(";");
        el.innerHTML = `🏠 <span>৳${(listing.rent_bdt/1000).toFixed(0)}k</span>`;

        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([listing.lng, listing.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${listing.title_en}</strong><br/>${listing.area}, Dhaka`))
          .addTo(map);

        el.addEventListener("click", () => {
          if (onSelectListing) onSelectListing(listing.id);
        });

        markersRef.current.push(marker);
      }
    });
  }, [listings, activeListingId, onSelectListing]);

  // Handle university selection & Routing path
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Remove old varsity marker
    if (univMarkerRef.current) {
      univMarkerRef.current.remove();
      univMarkerRef.current = null;
    }

    // Reset route line
    const resetRoute = () => {
      const source = map.getSource("route") as mapboxgl.GeoJSONSource | undefined;
      if (source) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        });
      }
      setRouteInfo(null);
    };

    resetRoute();

    const univ = UNIVERSITIES.find((u) => u.id === selectedUniversityId);
    if (!univ) return;

    // University marker — blue pill with short name label
    const el = document.createElement("div");
    el.style.cssText = [
      "display:flex","align-items:center","gap:5px",
      "background:#1a56a0","color:#fff",
      "padding:5px 10px","border-radius:999px",
      "font-size:12px","font-weight:700",
      "box-shadow:0 2px 8px rgba(0,0,0,0.3)",
      "border:2px solid #fff",
      "white-space:nowrap",
    ].join(";");
    el.innerHTML = `🎓 <span>${univ.short_name}</span>`;

    const univMarker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([univ.lng, univ.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${univ.short_name}</strong><br/>${univ.name}`))
      .addTo(map);

    univMarkerRef.current = univMarker;

    // Center map around the university
    map.flyTo({
      center: [univ.lng, univ.lat],
      zoom: 14,
      essential: true,
    });

    // If there is an active listing, draw route line
    const activeListing = listings.find((l) => l.id === activeListingId);
    if (activeListing && activeListing.lat && activeListing.lng) {
      getWalkingRoute([univ.lng, univ.lat], [activeListing.lng, activeListing.lat], token).then((route) => {
        if (route) {
          const source = map.getSource("route") as mapboxgl.GeoJSONSource | undefined;
          if (source) {
            source.setData({
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: route.coordinates,
              },
            });
          }
          setRouteInfo({
            distanceKm: route.distanceKm,
            durationMins: route.durationMins,
          });

          // Fit bounds to fit route
          const bounds = new mapboxgl.LngLatBounds();
          route.coordinates.forEach((coord) => bounds.extend(coord));
          map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
        }
      });
    }
  }, [selectedUniversityId, activeListingId, listings, token, mapLoaded]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {!token ? (
        <div style={{
          width: "100%", height: "100%",
          background: "linear-gradient(135deg, #0F2D1F 0%, #166534 60%, #22C55E 100%)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "2rem", textAlign: "center", position: "relative", overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", bottom: -40, left: -40, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}>🗺️</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", marginBottom: "0.4rem" }}>Map Not Configured</h3>
          <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", maxWidth: 280, lineHeight: 1.6 }}>
            Add your <code style={{ background: "rgba(255,255,255,0.15)", padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem" }}>NEXT_PUBLIC_MAPBOX_TOKEN</code> to your <code style={{ background: "rgba(255,255,255,0.15)", padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem" }}>.env</code> file to enable the interactive map with walking routes.
          </p>
        </div>
      ) : (
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%", borderRadius: "var(--radius-lg)" }} />
      )}
      {routeInfo && (
        <div style={{
          position: "absolute",
          bottom: "16px",
          left: "16px",
          right: "16px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(4px)",
          padding: "10px 14px",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lg)",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "1px solid var(--border)",
        }}>
          <div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
              🚶 Walking Path on Road
            </span>
            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--primary)" }}>
              {routeInfo.distanceKm.toFixed(2)} km
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
              Est. Duration
            </span>
            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--accent-hover)" }}>
              {Math.ceil(routeInfo.durationMins)} mins
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
