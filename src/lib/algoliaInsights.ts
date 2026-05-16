import aa from 'search-insights';
import { apiClient, API_ENDPOINTS } from './api';
import { AlgoliaConfigResponse } from '@/types/api';

let isInitialized = false;
let globalIndexName = 'prod_canonical_products';

export const initAlgoliaInsights = async (uuid: string) => {
  if (isInitialized) return;
  
  try {
    const config = await apiClient.get<AlgoliaConfigResponse>(API_ENDPOINTS.algoliaConfig());
    aa('init', {
      appId: config.app_id,
      apiKey: config.search_api_key,
      useCookie: true,
    });
    globalIndexName = config.index_name;
    // Use the same guest UUID for Algolia userToken
    aa('setUserToken', uuid);
    isInitialized = true;
  } catch (error) {
    console.error('Failed to init Algolia Insights:', error);
  }
};

export const sendProductClickEvent = (
  eventName: string,
  queryID: string,
  objectIDs: string[],
  positions: number[]
) => {
  if (!isInitialized || !queryID) return;
  aa('clickedObjectIDsAfterSearch', {
    index: globalIndexName,
    eventName,
    queryID,
    objectIDs,
    positions,
  });
};

export const sendProductAddToCartEvent = (
  eventName: string,
  queryID: string | undefined,
  objectIDs: string[],
  price?: number,
  quantity?: number
) => {
  if (!isInitialized) return;
  
  const objectData = (price !== undefined && quantity !== undefined && queryID) ? [{
    queryID,
    price,
    quantity
  }] : undefined;

  // If we have queryID, it's an add to cart after search
  if (queryID) {
    const payload: any = {
      index: globalIndexName,
      eventName,
      objectIDs,
      currency: "KZT",
    };
    if (objectData) {
      payload.objectData = objectData;
    } else {
      payload.queryID = queryID;
    }
    aa('addedToCartObjectIDsAfterSearch', payload);
  } else {
    aa('addedToCartObjectIDs', {
      index: globalIndexName,
      eventName,
      objectIDs,
      currency: "KZT",
    });
  }
};
