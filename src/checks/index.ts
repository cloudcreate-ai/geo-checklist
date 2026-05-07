import type { CheckDefinition } from '../types';
import { metaHeadChecks } from './meta-head';
import { headingStructureChecks } from './heading-structure';
import { contentQualityChecks } from './content-quality';
import { imagesMediaChecks } from './images-media';
import { linksNavigationChecks } from './links-navigation';
import { technicalChecks } from './technical';
import { socialRichMediaChecks } from './social-rich-media';
import { structuredDataChecks } from './structured-data';
import { entityAuthorityChecks } from './entity-authority';
import { contentFormatChecks } from './content-format';
import { aiCrawlerChecks } from './ai-crawler';
import { answerEngineChecks } from './answer-engine';

export const allChecks: CheckDefinition[] = [
  // SEO (Phase 1)
  ...metaHeadChecks,
  ...headingStructureChecks,
  ...contentQualityChecks,
  ...imagesMediaChecks,
  ...linksNavigationChecks,
  ...technicalChecks,
  ...socialRichMediaChecks,
  // GEO (Phase 2)
  ...structuredDataChecks,
  ...entityAuthorityChecks,
  ...contentFormatChecks,
  ...aiCrawlerChecks,
  ...answerEngineChecks,
];
