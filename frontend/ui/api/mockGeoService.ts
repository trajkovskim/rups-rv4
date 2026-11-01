import { getBundledMapGeoData } from './apiGeoService';
import type { MapGeoData } from './types';

export const getMockMapGeoData = async (): Promise<MapGeoData> =>
  getBundledMapGeoData();
