import React, { useEffect, useRef, useImperativeHandle } from 'react';
import {
  Map as MapGL,
  NavigationControl,
  Marker,
  Popup,
  LngLatBounds,
  type Point,
  type FilterSpecification,
  type LayerSpecification,
  type LngLat,
} from 'maplibre-gl';

export const EUROPE_BOUNDARIES = new LngLatBounds([-25.0, 34.0], [45.0, 71.5]);
const EUROPE_CENTER: [number, number] = [10.4515, 51.1657];
const EUROPE_ZOOM = 4;
const NOTHING_FILTER: FilterSpecification = ['==', ['get', 'country'], ''];

import 'maplibre-gl/dist/maplibre-gl.css';

import type { Feature, FeatureCollection, GeoJsonProperties, Geometry, Position } from 'geojson';

export interface EuropeMapRefHandle {
  remove: (r: Marker | Popup) => void;
  addMarker: (lngLat: LngLat) => Marker | null;
  addPopup: (lngLat: LngLat, content: string) => Popup | null;
  clear: () => void;
  highlightCountries: (countries: string[] | null) => void;
}

export type EuropeMapClickEvent = {
  country?: string;
  city?: string;
  point: Point;
  lngLat: LngLat;
};

export type EuropeMapDisplay = {
  water?: boolean;
  village?: boolean;
  country?: boolean;
  city?: boolean;
  state?: boolean;
  navigation?: boolean;
  // Skrije še ostale napise (manjši kraji, ceste, točke), da zemljevid ne izda odgovora
  hideOtherLabels?: boolean;
};

type MapProps = {
  display?: EuropeMapDisplay;
  geojson: FeatureCollection<Geometry, GeoJsonProperties>;
  boundaries?: LngLatBounds;

  onLoaded?: () => void;
  onClick?: (data: EuropeMapClickEvent) => void;
};

export type EuropeMapProps = MapProps &
  Omit<React.ComponentProps<'div'>, keyof MapProps | 'ref'> & {
    ref?: React.Ref<EuropeMapRefHandle>;
  };

const updateSymbolVisibility = (map: MapGL, layer: LayerSpecification, display: EuropeMapDisplay | undefined) => {
  if (layer.type !== 'symbol') {
    return;
  }

  const layerTypes = ['city', 'country', 'village', 'water', 'state'] as const;
  const matchingTypes = layerTypes.filter((layerType) => layer.id.includes(layerType));

  for (const layerType of matchingTypes) {
    map.setLayoutProperty(layer.id, 'visibility', display?.[layerType] ? 'visible' : 'none');
  }

  if (matchingTypes.length === 0) {
    map.setLayoutProperty(layer.id, 'visibility', display?.hideOtherLabels ? 'none' : 'visible');
  }
};

const ringArea = (ring: Position[]) =>
  Math.abs(
    ring.reduce((sum, [lng, lat], index) => {
      const [nextLng, nextLat] = ring[(index + 1) % ring.length];
      return sum + lng * nextLat - nextLng * lat;
    }, 0),
  ) / 2;

// Samo največji del države, da čezmorska ozemlja (npr. Francije) ne odmaknejo pogleda iz Evrope
const countryBounds = (feature: Feature<Geometry, GeoJsonProperties>): LngLatBounds | null => {
  const { geometry } = feature;
  if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') {
    return null;
  }
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const mainland = polygons.reduce((largest, polygon) =>
    ringArea(polygon[0]) > ringArea(largest[0]) ? polygon : largest,
  );
  const bounds = new LngLatBounds();
  for (const [lng, lat] of mainland[0]) {
    bounds.extend([
      Math.min(Math.max(lng, EUROPE_BOUNDARIES.getWest()), EUROPE_BOUNDARIES.getEast()),
      Math.min(Math.max(lat, EUROPE_BOUNDARIES.getSouth()), EUROPE_BOUNDARIES.getNorth()),
    ]);
  }
  return bounds;
};

const createMap = (
  container: HTMLDivElement,
  { display, boundaries = EUROPE_BOUNDARIES, ...rest }: MapProps,
): MapGL => {
  const map = new MapGL({
    container: container,
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: EUROPE_CENTER,
    zoom: EUROPE_ZOOM,
    minZoom: 3,
    maxZoom: 10,
    maxBounds: boundaries,
  });

  if (display?.navigation) {
    map.addControl(new NavigationControl(), 'top-right');
  }

  map.once('load', () => {
    map.getStyle().layers.forEach((layer) => {
      if (layer.type === 'symbol') {
        const isCityLayer = layer.id.includes('city');
        const isCountryLayer = layer.id.includes('country');

        if (isCityLayer || isCountryLayer) {
          map.setLayoutProperty(layer.id, 'text-font', ['Open Sans Regular', 'Arial Unicode MS Regular']);
        }
      }

      updateSymbolVisibility(map, layer, display);
    });

    map.addSource('data', {
      type: 'geojson',
      data: rest.geojson,
    });

    map.addLayer({
      id: 'data-layer',
      type: 'fill',
      source: 'data',
      paint: { 'fill-color': '#000000', 'fill-opacity': 0 },
    });

    map.addLayer({
      id: 'highlight-fill',
      type: 'fill',
      source: 'data',
      filter: NOTHING_FILTER,
      paint: { 'fill-color': '#3264f5', 'fill-opacity': 0.4 },
    });

    map.addLayer({
      id: 'highlight-line',
      type: 'line',
      source: 'data',
      filter: NOTHING_FILTER,
      paint: { 'line-color': '#1d3fb8', 'line-width': 2 },
    });
  });

  return map;
};

const EuropeMap = ({ ref, ...props }: EuropeMapProps) => {
  const { display, geojson, boundaries, onClick, onLoaded, ...rest } = props;

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapGL>(null);
  const markers = useRef<Marker[]>([]);
  const popups = useRef<Popup[]>([]);
  const handlersRef = useRef({ onClick, onLoaded });
  const geojsonRef = useRef(geojson);
  const hasHighlight = useRef(false);

  useEffect(() => {
    handlersRef.current.onClick = onClick;
    handlersRef.current.onLoaded = onLoaded;
    geojsonRef.current = geojson;
  }, [onClick, onLoaded, geojson]);

  useEffect(() => {
    if (mapContainer.current && !mapInstance.current) {
      const instance = createMap(mapContainer.current, { display, geojson, boundaries });

      instance.on('idle', () => onLoaded?.());
      instance.on('click', (event) => {
        const features = instance.queryRenderedFeatures(event.point);
        const relevantFeatures = features.filter((feature) => feature.layer.id === 'data-layer');
        const clickedFeature =
          relevantFeatures.find((feature) => 'city' in feature.properties && 'country' in feature.properties) ??
          relevantFeatures.find((feature) => 'city' in feature.properties || 'country' in feature.properties);

        handlersRef.current.onClick?.({
          lngLat: event.lngLat,
          point: event.point,
          city: clickedFeature?.properties.city,
          country: clickedFeature?.properties.country,
        });
      });

      mapInstance.current = instance;
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      remove: (element) => {
        if (element instanceof Marker) {
          markers.current = markers.current.filter((marker) => marker !== element);
        } else if (element instanceof Popup) {
          popups.current = popups.current.filter((popup) => popup !== element);
        }
        element.remove();
      },
      clear: () => {
        markers.current.forEach((marker) => marker.remove());
        popups.current.forEach((popup) => popup.remove());
        markers.current = [];
        popups.current = [];
      },
      highlightCountries: (countries) => {
        const map = mapInstance.current;
        if (!map?.getLayer('highlight-fill')) {
          return;
        }

        const filter: FilterSpecification = countries
          ? ['in', ['get', 'country'], ['literal', countries]]
          : NOTHING_FILTER;
        map.setFilter('highlight-fill', filter);
        map.setFilter('highlight-line', filter);

        if (!countries) {
          if (hasHighlight.current) {
            map.easeTo({ center: EUROPE_CENTER, zoom: EUROPE_ZOOM });
          }
          hasHighlight.current = false;
          return;
        }

        hasHighlight.current = true;
        const bounds = new LngLatBounds();
        for (const feature of geojsonRef.current.features) {
          if (countries.includes(feature.properties?.country)) {
            const featureBounds = countryBounds(feature);
            if (featureBounds) bounds.extend(featureBounds);
          }
        }
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, {
            padding: { top: 90, bottom: 190, left: 50, right: 50 },
            maxZoom: 7,
            duration: 600,
          });
        }
      },
      addPopup: (lngLat, content) => {
        if (!mapInstance.current) {
          return null;
        }

        const popup = new Popup({ closeButton: false, closeOnClick: false, closeOnMove: false })
          .setLngLat(lngLat)
          .setText(content)
          .addTo(mapInstance.current);
          
        const popupElement = popup.getElement();
        popupElement.addEventListener('mouseenter', () => {
          popupElement.style.zIndex = '10';
        });
        popupElement.addEventListener('mouseleave', () => {
          popupElement.style.zIndex = '';
        });

        popups.current.push(popup);
        return popup;
      },
      addMarker: (lngLat) => {
        if (!mapInstance.current) {
          return null;
        }

        const marker = new Marker().setLngLat(lngLat).addTo(mapInstance.current);
        markers.current.push(marker);
        return marker;
      },
    }),
    [],
  );

  useEffect(() => {
    mapInstance.current?.getStyle()?.layers.forEach((layer) => {
      updateSymbolVisibility(mapInstance.current!, layer, display);
    });
  }, [display]);

  return <div {...rest} ref={mapContainer} />;
};

export default EuropeMap;
