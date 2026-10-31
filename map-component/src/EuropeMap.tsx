import React, { useEffect, useRef } from 'react';
import { Map, NavigationControl, LngLatBounds, setWorkerUrl } from 'maplibre-gl';
import { EUROPE_BOUNDARIES } from './constants';

import 'maplibre-gl/dist/maplibre-gl.css';

import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

setWorkerUrl(workerUrl);

type ClickEventData = {
  country?: string;
  city?: string;
};

type MapProps = {
  navigation?: boolean;
  displayCityName?: boolean;

  geojson?: any;
  boundaries?: LngLatBounds;

  onClick?: (data: ClickEventData) => void;
};

type Props = MapProps & Omit<React.ComponentProps<'div'>, keyof MapProps>;

const createMap = (
  container: HTMLDivElement,
  { navigation = true, displayCityName = true, boundaries = EUROPE_BOUNDARIES, ...rest }: MapProps,
) => {
  const map = new Map({
    container: container,
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [10.4515, 51.1657],
    zoom: 4,
    minZoom: 3,
    maxZoom: 10,
    maxBounds: boundaries,
  });

  if (navigation) {
    map.addControl(new NavigationControl(), 'top-right');
  }

  map.on('load', () => {
    map.getStyle().layers.forEach((layer) => {
      if (layer.type === 'symbol' && ['city', 'settlement', 'place'].some((value) => layer.id.includes(value))) {
        map.setLayoutProperty(layer.id, 'text-font', ['Open Sans Regular', 'Arial Unicode MS Regular']);

        if (!displayCityName) {
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
      const clickedFeature = features.find((f) => f.layer.id === 'data-layer');

      if (clickedFeature) {
        rest.onClick?.(clickedFeature.properties as ClickEventData);
      }
    });
  });

  return map;
};

const EuropeMap: React.FC<Props> = (props: Props) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map>(null);

  const { navigation, displayCityName, geojson, boundaries, onClick, ...rest } = props;

  useEffect(() => {
    if (mapContainer.current) {
      const instance = createMap(mapContainer.current!, props);
      mapInstance.current = instance;
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <React.Suspense>
      <div ref={mapContainer} {...rest} />
    </React.Suspense>
  );
};

export default EuropeMap;
