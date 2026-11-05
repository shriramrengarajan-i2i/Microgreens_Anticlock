/** Logical index names; the configured prefix is added by SearchService.indexName(). */
export const SEARCH_INDEXES = {
  knowledge: 'knowledge',
  smokeCheck: 'smoke-check',
} as const;

/**
 * Base index configuration (placeholder). The knowledge-base feature work defines the
 * full mapping (topic, variety, source title/URL); dynamic mapping stays on until then.
 */
export const BASE_INDEX_CONFIG = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
  },
  mappings: {
    dynamic: true,
    properties: {
      title: { type: 'text' },
      content: { type: 'text' },
      createdAt: { type: 'date' },
    },
  },
} as const;
