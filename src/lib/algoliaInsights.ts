import aa from 'search-insights';
import { apiClient, API_ENDPOINTS } from './api';
import { AlgoliaConfigResponse } from '@/types/api';
import { reportClientError } from "@/lib/clientErrors";
import { isUuid } from "@/lib/uuid";

let isInitialized = false;
let globalIndexName = 'prod_canonical_products';
let globalSuggestionsIndexName = 'prod_canonical_products_query_suggestions';

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
    globalSuggestionsIndexName = globalIndexName + '_query_suggestions';
    // Use the same guest UUID for Algolia userToken
    aa('setUserToken', uuid);
    isInitialized = true;
  } catch (error) {
    reportClientError("algolia:init_insights", error);
  }
};

// Re-point Algolia Insights at a different userToken (e.g. the account's
// canonical guest_uuid after login) without re-running full init. A no-op
// until initAlgoliaInsights has run once, since aa() needs appId/apiKey first.
export const setAlgoliaUserToken = (uuid: string) => {
  if (!isInitialized) return;
  aa('setUserToken', uuid);
};

// Algolia Insights has no `viewedObjectIDsAfterSearch` — view events are
// always queryID-less, unlike click/convert which have AfterSearch variants.
export const sendProductViewedEvent = (objectIDs: string[]) => {
  if (!isInitialized || objectIDs.length === 0 || !objectIDs.every(isUuid)) return;
  aa('viewedObjectIDs', {
    index: globalIndexName,
    eventName: 'Product Viewed',
    objectIDs,
  });
};

export const sendProductClickEvent = (
  eventName: string,
  queryID: string,
  objectIDs: string[],
  positions: number[]
) => {
  if (!isInitialized || !queryID || !objectIDs.every(isUuid)) return;
  aa('clickedObjectIDsAfterSearch', {
    index: globalIndexName,
    eventName,
    queryID,
    objectIDs,
    positions,
  });
};

export const sendSuggestionClickEvent = (
  queryID: string,
  objectID: string,
  position: number
) => {
  if (!isInitialized || !queryID) return;
  aa('clickedObjectIDsAfterSearch', {
    index: globalSuggestionsIndexName,
    eventName: 'Suggestion Clicked',
    queryID,
    objectIDs: [objectID],
    positions: [position],
  });
};

export const sendProductAddToCartEvent = (
  eventName: string,
  queryID: string | undefined,
  objectIDs: string[],
  price?: number,
  quantity?: number
) => {
  if (!isInitialized || !objectIDs.every(isUuid)) return;

  const objectData = (price !== undefined && quantity !== undefined && queryID) ? [{
    queryID,
    price,
    quantity
  }] : undefined;

  // If we have queryID, it's an add to cart after search
  if (queryID) {
    const payload: {
      index: string;
      eventName: string;
      objectIDs: string[];
      currency: string;
      queryID: string;
      objectData?: { queryID: string; price: number; quantity: number }[];
    } = {
      index: globalIndexName,
      eventName,
      objectIDs,
      currency: "KZT",
      queryID,
    };
    if (objectData) {
      payload.objectData = objectData;
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

export const sendProductConversionEvent = (
  eventName: string,
  queryID: string | undefined,
  objectIDs: string[],
) => {
  if (!isInitialized || objectIDs.length === 0 || !objectIDs.every(isUuid)) return;

  if (queryID) {
    aa('convertedObjectIDsAfterSearch', {
      index: globalIndexName,
      eventName,
      queryID,
      objectIDs,
    });
    return;
  }

  aa('convertedObjectIDs', {
    index: globalIndexName,
    eventName,
    objectIDs,
  });
};
