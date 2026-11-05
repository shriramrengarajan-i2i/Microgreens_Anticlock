import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SEARCH_INDEXES } from './search-index.config';
import { SearchService } from './search.service';

/**
 * Developer check: connects with the backend's configured settings, ensures the base
 * knowledge index exists, then indexes a sample document into a throwaway index and
 * finds it with a match query. Exits non-zero on any failure.
 */
async function main(): Promise<void> {
  const logger = new Logger('SearchCheck');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  const search = app.get(SearchService);
  const smokeIndex = search.indexName(SEARCH_INDEXES.smokeCheck);
  try {
    const { clusterName, version } = await search.ping();
    logger.log(`Connected to Elasticsearch ${version} (cluster "${clusterName}")`);

    const knowledgeIndex = search.indexName(SEARCH_INDEXES.knowledge);
    const created = await search.ensureIndex(knowledgeIndex);
    logger.log(`Base index ${knowledgeIndex} ${created ? 'created' : 'already exists'}`);

    await search.deleteIndex(smokeIndex);
    await search.ensureIndex(smokeIndex);
    const id = `sample-${Date.now()}`;
    await search.indexDocument(
      smokeIndex,
      id,
      { title: 'Sample microgreens note', content: 'Sunflower microgreens grow quickly', createdAt: new Date().toISOString() },
      true,
    );
    const hits = await search.match(smokeIndex, 'content', 'sunflower');
    if (!hits.some((hit) => hit.id === id)) {
      throw new Error(`Match query on ${smokeIndex} did not return the sample document ${id}`);
    }
    logger.log(`Indexed ${id} into ${smokeIndex} and retrieved it with a match query`);
  } finally {
    await search.deleteIndex(smokeIndex).catch((error: Error) => {
      logger.warn(`Could not delete ${smokeIndex}: ${error.message}`);
    });
    await app.close();
  }
}

main().catch((error: Error) => {
  new Logger('SearchCheck').error(`Search check failed: ${error.message}`);
  process.exitCode = 1;
});
