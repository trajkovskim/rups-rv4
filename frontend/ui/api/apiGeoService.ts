import type { Feature, FeatureCollection, GeoJsonProperties, Geometry, Position } from 'geojson';
import europeGeoData from './europe.geo.json';
import { requestJson } from './api';
import type { MapGeoData } from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isPosition = (value: unknown): value is Position =>
  Array.isArray(value) &&
  value.length >= 2 &&
  value.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate));

const isPositionArray = (value: unknown): value is Position[] =>
  Array.isArray(value) && value.every(isPosition);

const isRingArray = (value: unknown): value is Position[][] =>
  Array.isArray(value) && value.every(isPositionArray);

const isMultiPolygonCoordinates = (value: unknown): value is Position[][][] =>
  Array.isArray(value) && value.every(isRingArray);

const isGeometry = (value: unknown): value is Geometry => {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false;
  }

  if (value.type === 'GeometryCollection') {
    return Array.isArray(value.geometries) && value.geometries.every(isGeometry);
  }

  if (!('coordinates' in value)) {
    return false;
  }

  switch (value.type) {
    case 'Point':
      return isPosition(value.coordinates);
    case 'MultiPoint':
    case 'LineString':
      return isPositionArray(value.coordinates);
    case 'MultiLineString':
    case 'Polygon':
      return isRingArray(value.coordinates);
    case 'MultiPolygon':
      return isMultiPolygonCoordinates(value.coordinates);
    default:
      return false;
  }
};

const isFeature = (value: unknown): value is Feature<Geometry, GeoJsonProperties> =>
  isRecord(value) &&
  value.type === 'Feature' &&
  (value.geometry === null || isGeometry(value.geometry)) &&
  (value.properties === null || isRecord(value.properties)) &&
  (!('id' in value) || typeof value.id === 'string' || typeof value.id === 'number');

const isMapGeoData = (value: unknown): value is MapGeoData =>
  isRecord(value) &&
  value.type === 'FeatureCollection' &&
  Array.isArray(value.features) &&
  value.features.every(isFeature);

const parseMapGeoData = (value: unknown): MapGeoData => {
  if (!isMapGeoData(value)) {
    throw new TypeError('Invalid GeoJSON FeatureCollection');
  }
  return value;
};

export const getBundledMapGeoData = (): MapGeoData => europeGeoData as FeatureCollection;

export const getMapGeoData = async (signal?: AbortSignal): Promise<MapGeoData> => {
  const data = await requestJson('/geojson', { signal });
  return parseMapGeoData(data);
};