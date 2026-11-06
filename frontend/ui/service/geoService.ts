import { getMapGeoData as getApiMapGeoData } from '../api/apiGeoService';
import { getMockMapGeoData } from '../api/mockGeoService';

const useMockGeo = process.env.NEXT_PUBLIC_USE_MOCK_GEO === 'true';

export const getMapGeoData = (signal?: AbortSignal) =>
  useMockGeo ? getMockMapGeoData() : getApiMapGeoData(signal);
