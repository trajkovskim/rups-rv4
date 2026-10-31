import React, { useEffect, useRef, useState, useImperativeHandle } from 'react';
import {
  Map,
  NavigationControl,
  LngLatBounds,
  setWorkerUrl,
  Point,
  type LayerSpecification,
  Marker,
} from 'maplibre-gl';
import { EUROPE_BOUNDARIES } from './constants';

import 'maplibre-gl/dist/maplibre-gl.css';

import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import LoadingSpinner from './LoadingSpinner';

setWorkerUrl(workerUrl);

export interface EuropeMapRefHandle {
  marker?: Marker | null;
  clearMarker: () => void;
}

type ClickEventData = {
  country?: string;
  city?: string;
  point: Point;
};

type MapProps = {
  display?: {
    water?: boolean;
    village?: boolean;
    country?: boolean;
    city?: boolean;
    state?: boolean;
    navigation?: boolean;
  };

  geojson?: any;
  boundaries?: LngLatBounds;

  onClick?: (data: ClickEventData) => void;
};

type Props = MapProps & Omit<React.ComponentProps<'div'>, keyof MapProps | 'ref'> & {
  ref?: React.Ref<EuropeMapRefHandle>;
};

const updateSymbolVisibility = (map: Map, layer: LayerSpecification, display: MapProps['display']) => {
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

const EuropeMap: React.FC<Props> = ({ref, ...props}: Props) => {
  const { display, geojson, boundaries, onClick, ...rest } = props;

  const [loading, setLoading] = useState<boolean>(true);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map>(null);
  const marker = useRef<Marker>(null);
  const onClickRef = useRef(onClick);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    if (mapContainer.current && !mapInstance.current) {
      const instance = createMap(mapContainer.current, { display, geojson, boundaries });

      instance.on('idle', () => setLoading(false));
      instance.on('click', (event) => {
        const features = instance.queryRenderedFeatures(event.point);
        const relevantFeatures = features.filter((feature) => feature.layer.id === 'data-layer');
        const clickedFeature =
          relevantFeatures.find((feature) => 'city' in feature.properties && 'country' in feature.properties) ??
          relevantFeatures.find((feature) => 'city' in feature.properties || 'country' in feature.properties);
        if (!clickedFeature) {
          return;
        }

        if (marker.current) {
          marker.current.remove();
        }

        marker.current = new Marker().setLngLat(event.lngLat).addTo(instance);
        onClickRef.current?.({
          point: event.point,
          city: clickedFeature.properties.city,
          country: clickedFeature.properties.country,
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

  useImperativeHandle(ref, () => ({
    clearMarker: () => marker.current?.remove(),
    marker: marker.current
  }), []);

  useEffect(() => {
    mapInstance.current?.getStyle()?.layers.forEach((layer) => {
      updateSymbolVisibility(mapInstance.current!, layer, display);
    });
  }, [display, loading]);

  return (
    <div>
      {loading && <LoadingSpinner />}
      <div
        {...rest}
        ref={mapContainer}
        style={{
          transition: 'opacity 400ms ease-in',
          opacity: loading ? 0 : 1,
          visibility: loading ? 'hidden' : 'visible',
          ...rest.style,
        }}
      />
    </div>
  );
};

export default EuropeMap;
