import type { CheckDefinition } from '../types';
import { metaHeadChecks } from './meta-head';
import { headingStructureChecks } from './heading-structure';
import { contentQualityChecks } from './content-quality';
import { imagesMediaChecks } from './images-media';
import { linksNavigationChecks } from './links-navigation';
import { technicalChecks } from './technical';
import { socialRichMediaChecks } from './social-rich-media';

export const allChecks: CheckDefinition[] = [
  ...metaHeadChecks,
  ...headingStructureChecks,
  ...contentQualityChecks,
  ...imagesMediaChecks,
  ...linksNavigationChecks,
  ...technicalChecks,
  ...socialRichMediaChecks,
];
