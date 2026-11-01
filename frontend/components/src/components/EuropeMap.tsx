import React, { useEffect, useRef, useImperativeHandle } from 'react';
import {
  Map,
  NavigationControl,
  Marker,
  Popup,
  LngLatBounds,
  type Point,
  type LayerSpecification,
  type LngLat,

} from 'maplibre-gl';

export const EUROPE_BOUNDARIES = new LngLatBounds([-25.0, 34.0], [45.0, 71.5]);

import 'maplibre-gl/dist/maplibre-gl.css';

import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

export interface EuropeMapRefHandle {
  addMarker: (lngLat: LngLat) => void;
  marker: () => Marker | null;
  removeMarker: () => void;
  addPopup: (lngLat: LngLat, content: string) => void;
  removePopup: () => void;
  popup: () => Popup | null;
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

const updateSymbolVisibility = (map: Map, layer: LayerSpecification, display: EuropeMapDisplay | undefined) => {
  if (layer.type !== 'symbol') {
    return;
  }

  for (const layerType of ['city', 'country', 'village', 'water', 'state']) {
    if (layer.id.includes(layerType)) {
      map.setLayoutProperty(
        layer.id,
        'visibility',
        display?.[layerType as keyof MapProps['display']] ? 'visible' : 'none',
      );
    }
  }
};

const createMap = (container: HTMLDivElement, { display, boundaries = EUROPE_BOUNDARIES, ...rest }: MapProps): Map => {
  const map = new Map({
    container: container,
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [10.4515, 51.1657],
    zoom: 4,
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
  });

  return map;
};

const EuropeMap = ({ ref, ...props }: EuropeMapProps) => {
  const { display, geojson, boundaries, onClick, onLoaded, ...rest } = props;

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map>(null);
  const marker = useRef<Marker>(null);
  const popup = useRef<Popup>(null);
  const handlersRef = useRef({ onClick, onLoaded });

  useEffect(() => {
    handlersRef.current.onClick = onClick;
    handlersRef.current.onLoaded = onLoaded;
  }, [onClick, onLoaded]);

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
      popup: () => popup.current,
      addPopup: (lngLat, content) => {
        popup.current?.remove();
        if (mapInstance.current) {
          popup.current = new Popup({ closeButton: false, closeOnClick: false, closeOnMove: false })
            .setLngLat(lngLat)
            .setText(content)
            .addTo(mapInstance.current);
        }
      },
      removePopup: () => popup.current?.remove(),
      marker: () => marker.current,
      addMarker: (lngLat) => {
        marker.current?.remove();
        if (mapInstance.current) {
          marker.current = new Marker().setLngLat(lngLat).addTo(mapInstance.current);
        }
      },
      removeMarker: () => marker.current?.remove(),
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