import React, { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, LngLatBounds, setWorkerUrl, Point } from 'maplibre-gl';
import { EUROPE_BOUNDARIES } from './constants';

import 'maplibre-gl/dist/maplibre-gl.css';

import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import LoadingSpinner from './LoadingSpinner';

setWorkerUrl(workerUrl);

type ClickEventData = {
  country?: string;
  city?: string;
  position: Point;
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

type Props = MapProps & Omit<React.ComponentProps<'div'>, keyof MapProps>;

const createMap = (
  container: HTMLDivElement,
  { display, boundaries = EUROPE_BOUNDARIES, ...rest }: MapProps,
): Promise<Map> => {
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

  return new Promise<Map>((resolve) => {
    map.once('load', () => {
      map.getStyle().layers.forEach((layer) => {
        if (layer.type === 'symbol') {
          const isCityLayer = layer.id.includes('city');
          const isCountryLayer = layer.id.includes('country');

          if (isCityLayer || isCountryLayer) {
            map.setLayoutProperty(layer.id, 'text-font', ['Open Sans Regular', 'Arial Unicode MS Regular']);
          }

          if (
            (isCityLayer && !display?.city) ||
            (isCountryLayer && !display?.country) ||
            (layer.id.includes('village') && !display?.village) ||
            (layer.id.includes('water') && !display?.water) ||
            (layer.id.includes('state') && !display?.state)
          ) {
            map.setLayoutProperty(layer.id, 'visibility', 'none');
          }
        }
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

      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point);
        console.log(features);

        const clickedFeature = features.find((f) => f.layer.id === 'data-layer');
        if (clickedFeature) {
          rest.onClick?.({ position: e.point, ...clickedFeature.properties });
        }
      });
    });

    map.on('idle', () => {
      resolve(map);
    });
  });
};

const EuropeMap: React.FC<Props> = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(true);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map>(null);

  const { display, geojson, boundaries, onClick, ...rest } = props;

  useEffect(() => {
    if (mapContainer.current) {
      createMap(mapContainer.current, props).then((instance) => {
        mapInstance.current = instance;
        setLoading(false);
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

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
