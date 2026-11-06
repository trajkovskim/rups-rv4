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
  type ExpressionSpecification,
} from 'maplibre-gl';
import styles from './EuropeMap.module.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry, LineString, Position } from 'geojson';

const INITIAL_VIEW = {
  center: [4, 52.5] as [number, number],
  zoom: 3.6,
};
const NOTHING_FILTER: FilterSpecification = ['==', ['get', 'country'], ''];

const COUNTRY_FILL_COLOR: ExpressionSpecification = [
  'match',
  ['get', 'country'],

  ['Albania', 'Cyprus No Mans Area', 'Czechia', 'Finland', 'Iceland', 'Italy', 'Lithuania', 'Netherlands', 'Republic of Serbia', 'Ukraine'],
  '#4bd472',

  ['Estonia', 'France', 'Greece', 'Hungary', 'Kosovo', 'Malta', 'Norway', 'Poland', 'Portugal', 'Vatican'],
  '#da0468',

  ['Austria', 'Belgium', 'Cyprus', 'Denmark', 'Montenegro', 'Romania', 'Russia', 'Spain', 'Sweden', 'United Kingdom'],
  '#d22a04',

  ['Croatia', 'Latvia', 'Luxembourg', 'Moldova', 'Monaco', 'North Macedonia', 'Northern Cyprus', 'San Marino', 'Switzerland', 'Turkey'],
  '#3807dc',

  ['Andorra', 'Belarus', 'Bosnia and Herzegovina', 'Bulgaria', 'Germany', 'Ireland', 'Liechtenstein', 'Slovakia', 'Slovenia'],
  '#d89206',

  '#daa208',
];
const COUNTRY_OUTLINE_COLOR = '#f5f5f5';

const COUNTRY_COLORS: Record<string, string> = {
  Albania: '#4bd472',
  'Cyprus No Mans Area': '#4bd472',
  Czechia: '#4bd472',
  Finland: '#4bd472',
  Iceland: '#4bd472',
  Italy: '#4bd472',
  Lithuania: '#4bd472',
  Netherlands: '#4bd472',
  'Republic of Serbia': '#4bd472',
  Ukraine: '#4bd472',

  Estonia: '#da0468',
  France: '#da0468',
  Greece: '#da0468',
  Hungary: '#da0468',
  Kosovo: '#da0468',
  Malta: '#da0468',
  Norway: '#da0468',
  Poland: '#da0468',
  Portugal: '#da0468',
  Vatican: '#da0468',

  Austria: '#d22a04',
  Belgium: '#d22a04',
  Cyprus: '#d22a04',
  Denmark: '#d22a04',
  Montenegro: '#d22a04',
  Romania: '#d22a04',
  Russia: '#d22a04',
  Spain: '#d22a04',
  Sweden: '#d22a04',
  'United Kingdom': '#d22a04',

  Croatia: '#3807dc',
  Latvia: '#3807dc',
  Luxembourg: '#3807dc',
  Moldova: '#3807dc',
  Monaco: '#3807dc',
  'North Macedonia': '#3807dc',
  'Northern Cyprus': '#3807dc',
  'San Marino': '#3807dc',
  Switzerland: '#3807dc',
  Turkey: '#3807dc',

  Andorra: '#d89206',
  Belarus: '#d89206',
  'Bosnia and Herzegovina': '#d89206',
  Bulgaria: '#d89206',
  Germany: '#d89206',
  Ireland: '#d89206',
  Liechtenstein: '#d89206',
  Slovakia: '#d89206',
  Slovenia: '#d89206',
};

const getCountryColor = (country: unknown) =>
  typeof country === 'string' ? COUNTRY_COLORS[country] ?? '#daa208' : '#daa208';

const ANSWER_LINE_SOURCE = 'answer-connector-source';
const ANSWER_LINE_LAYER = 'answer-connector-layer';

export interface EuropeMapRefHandle {
  remove: (r: Marker | Popup) => void;
  addMarker: (lngLat: LngLat) => Marker | null;
  addPopup: (lngLat: LngLat, content: string) => Popup | null;
  clear: () => void;
  highlightCountries: (countries: string[] | null) => void;
  showAnswerLocation: (lngLat: LngLat) => void;
  addDottedLine: (start: LngLat, end: LngLat) => void;

  addAnswerMarker: (lngLat: LngLat) => Marker | null;
  addAnswerPopup: (
    lngLat: LngLat,
    locationName: string,
    fact: string,
    distance: string,
    distanceTier: 'good' | 'medium' | 'far',
  ) => Popup | null;
}

export type EuropeMapClickEvent = {
  country?: string;
  city?: string;
  point: Point;
  lngLat: LngLat;
};

export type EuropeMapDisplay = {
  country?: boolean;
  city?: boolean;
  navigation?: boolean;
};

type MapProps = {
  display?: EuropeMapDisplay;
  geojson: FeatureCollection<Geometry, GeoJsonProperties>;

  onLoaded?: () => void;
  onClick?: (data: EuropeMapClickEvent) => void;
};

export type EuropeMapProps = MapProps &
  Omit<React.ComponentProps<'div'>, keyof MapProps | 'ref'> & {
    ref?: React.Ref<EuropeMapRefHandle>;
  };

const updateSymbolVisibility = (map: MapGL, layer: LayerSpecification) => {
  const id = layer.id;

  const shouldHide =
    layer.type === 'symbol' ||
    /^(road|tunnel|bridge|building|aeroway)/.test(id) ||
    /park|protected|national/i.test(id) ||
    id === 'boundary_3' ||
    [
      'landcover_grass',
      'landcover_ice',
      'landcover_wetland',
      'landcover_sand',
      'landuse_pitch',
      'landuse_track',
      'landuse_cemetery',
      'landuse_hospital',
      'landuse_school',
    ].includes(id);

  if (shouldHide) {
    map.setLayoutProperty(id, 'visibility', 'none');
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
    bounds.extend([lng, lat]);
  }

  return bounds;
};

const pointInRing = (point: LngLat, ring: Position[]) => {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    if (
      (yi > point.lat) !== (yj > point.lat) &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
};

const containsPoint = (
  feature: Feature<Geometry, GeoJsonProperties>,
  point: LngLat,
) => {
  const geometry = feature.geometry;

  if (geometry.type === 'Polygon') {
    return (
      pointInRing(point, geometry.coordinates[0]) &&
      !geometry.coordinates.slice(1).some((ring) => pointInRing(point, ring))
    );
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some(
      (polygon) =>
        pointInRing(point, polygon[0]) &&
        !polygon.slice(1).some((ring) => pointInRing(point, ring)),
    );
  }

  return false;
};

const createMap = (
  container: HTMLDivElement,
  { display, geojson }: MapProps,
): MapGL => {
  const map = new MapGL({
    container,
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: INITIAL_VIEW.center,
    zoom: INITIAL_VIEW.zoom,
    minZoom: 3,
    maxZoom: 10,
    dragPan: true,
    scrollZoom: true,
    boxZoom: false,
    doubleClickZoom: false,
    keyboard: false,
    touchZoomRotate: false,
    dragRotate: false,
  });

  map.once('style.load', () => {
    map.setProjection({ type: 'globe' });
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

      updateSymbolVisibility(map, layer);
    });

    if (map.getLayer('water')) {
      map.setPaintProperty('water', 'fill-color', '#b9ddf0bf');
    }

    map.addSource('data', {
      type: 'geojson',
      data: geojson,
    });

    map.addLayer({
      id: 'data-layer',
      type: 'fill',
      source: 'data',
      paint: {
        'fill-color': COUNTRY_FILL_COLOR,
        'fill-opacity': 0.38,
      },
    }, 'water');

    map.addLayer({
      id: 'country-outlines',
      type: 'line',
      source: 'data',
      paint: {
        'line-color': COUNTRY_OUTLINE_COLOR,
        'line-width': 1.7,
        'line-opacity': 0.85,
      },
    });

    map.addLayer({
      id: 'highlight-fill',
      type: 'fill',
      source: 'data',
      filter: NOTHING_FILTER,
      paint: {
        'fill-color': COUNTRY_FILL_COLOR,
        'fill-opacity': 0.73,
      },
    });

    map.addLayer({
      id: 'highlight-line',
      type: 'line',
      source: 'data',
      filter: NOTHING_FILTER,
      paint: {
        'line-color': COUNTRY_OUTLINE_COLOR,
        'line-width': 3.7,
        'line-opacity': 0.95,
      },
    });
  });

  return map;
};

const EuropeMap = ({ ref, ...props }: EuropeMapProps) => {
  const { display, geojson, onClick, onLoaded, ...rest } = props;

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapGL>(null);
  const markers = useRef<Marker[]>([]);
  const popups = useRef<Popup[]>([]);
  const handlersRef = useRef({ onClick, onLoaded });
  const geojsonRef = useRef(geojson);
  const answerColorRef = useRef('#daa208');

  const getAnswerColor = (lngLat: LngLat) => {
    const feature = geojsonRef.current.features.find((feature) =>
      containsPoint(feature, lngLat),
    );
    const color = getCountryColor(feature?.properties?.country);
    answerColorRef.current = color;
    return color;
  };

  useEffect(() => {
    handlersRef.current.onClick = onClick;
    handlersRef.current.onLoaded = onLoaded;
    geojsonRef.current = geojson;
  }, [onClick, onLoaded, geojson]);

  useEffect(() => {
    if (mapContainer.current && !mapInstance.current) {
      const instance = createMap(mapContainer.current, { display, geojson });

      instance.on('idle', () => handlersRef.current.onLoaded?.());
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

        const map = mapInstance.current;

        if (map?.getLayer(ANSWER_LINE_LAYER)) {
          map.removeLayer(ANSWER_LINE_LAYER);
        }
        if (map?.getSource(ANSWER_LINE_SOURCE)) {
          map.removeSource(ANSWER_LINE_SOURCE);
        }

        if (map?.getLayer('highlight-fill')) {
          map.setFilter('highlight-fill', NOTHING_FILTER);
          map.setFilter('highlight-line', NOTHING_FILTER);
        }

        map?.easeTo({
          center: INITIAL_VIEW.center,
          zoom: INITIAL_VIEW.zoom,
          duration: 650,
        });
      },
      showAnswerLocation: (lngLat: LngLat) => {
        const map = mapInstance.current;
        if (!map?.getLayer('highlight-fill')) return;

        const feature = geojsonRef.current.features.find((feature) =>
          containsPoint(feature, lngLat),
        );

        const country = feature?.properties?.country;
        getAnswerColor(lngLat);

        const filter: FilterSpecification =
          typeof country === 'string'
            ? ['==', ['get', 'country'], country]
            : NOTHING_FILTER;

        map.setFilter('highlight-fill', filter);
        map.setFilter('highlight-line', filter);

        map.easeTo({
          center: lngLat,
          zoom: Math.min(map.getZoom() + 0.45, 6),
          duration: 650,
        });
      },
      addDottedLine: (start, end) => {
        const map = mapInstance.current;
        if (!map) return;
        const answerColor = getAnswerColor(end);

        if (map.getLayer(ANSWER_LINE_LAYER)) {
          map.removeLayer(ANSWER_LINE_LAYER);
        }
        if (map.getSource(ANSWER_LINE_SOURCE)) {
          map.removeSource(ANSWER_LINE_SOURCE);
        }

        const route: Feature<LineString, GeoJsonProperties> = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [start.lng, start.lat],
              [end.lng, end.lat],
            ],
          },
        };

        map.addSource(ANSWER_LINE_SOURCE, {
          type: 'geojson',
          data: route,
        });

        map.addLayer({
          id: ANSWER_LINE_LAYER,
          type: 'line',
          source: ANSWER_LINE_SOURCE,
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': answerColor,
            'line-width': 2.5,
            'line-opacity': 0.95,
            'line-dasharray': [0.1, 1.5],
          },
        });
      },
      addAnswerMarker: (lngLat) => {
        const map = mapInstance.current;
        if (!map) return null;
        const answerColor = getAnswerColor(lngLat);

        const marker = new Marker({ color: answerColor })
          .setLngLat(lngLat)
          .addTo(map);

        markers.current.push(marker);
        return marker;
      },
      addAnswerPopup: (lngLat, locationName, fact, distance, distanceTier) => {
        const map = mapInstance.current;
        if (!map) return null;
        const answerColor = getAnswerColor(lngLat);

        const card = document.createElement('div');
        card.className = styles.answerPopup;

        const header = document.createElement('div');
        header.className = styles.answerPopupHeader;

        const titleGroup = document.createElement('div');
        titleGroup.className = styles.answerPopupTitleGroup;

        const dot = document.createElement('span');
        dot.className = styles.answerPopupDot;
        dot.style.backgroundColor = answerColor;

        const title = document.createElement('strong');
        title.className = styles.answerPopupTitle;
        title.textContent = locationName;

        titleGroup.append(dot, title);

        const distanceLabel = document.createElement('span');
        distanceLabel.className = `${styles.answerPopupDistance} ${styles[`answerPopupDistance_${distanceTier}`]}`;
        distanceLabel.textContent = distance;

        header.append(titleGroup, distanceLabel);

        const eyebrow = document.createElement('div');
        eyebrow.className = styles.answerPopupEyebrow;
        eyebrow.style.color = answerColor;
        eyebrow.textContent = 'ALI VEŠ?';

        const factText = document.createElement('p');
        factText.className = styles.answerPopupFact;
        factText.textContent = fact;

        card.append(header, eyebrow, factText);

        const popup = new Popup({
          closeButton: false,
          closeOnClick: false,
          closeOnMove: false,
          anchor: 'left',
          offset: [14, 0],
          maxWidth: '340px',
          className: styles.answerPopupRoot,
        })
          .setLngLat(lngLat)
          .setDOMContent(card)
          .addTo(map);

        popups.current.push(popup);
        return popup;
      },
      highlightCountries: (countries) => {
        const map = mapInstance.current;
        if (!map?.getLayer('highlight-fill')) return;

        const filter: FilterSpecification = countries
          ? ['in', ['get', 'country'], ['literal', countries]]
          : NOTHING_FILTER;

        map.setFilter('highlight-fill', filter);
        map.setFilter('highlight-line', filter);

        if (!countries) {
          return;
        }

        const bounds = new LngLatBounds();

        for (const feature of geojsonRef.current.features) {
          if (countries.includes(feature.properties?.country)) {
            const featureBounds = countryBounds(feature);
            if (featureBounds) bounds.extend(featureBounds);
          }
        }

        if (!bounds.isEmpty()) {
          map.easeTo({
            center: bounds.getCenter(),
            zoom: Math.min(map.getZoom() + 0.65, 6),
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

  return <div {...rest} ref={mapContainer} />;
};

export default EuropeMap;
