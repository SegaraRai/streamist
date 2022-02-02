import {
  useRegionsDevelopment,
  useRegionsProduction,
  useRegionsStaging,
} from '$shared/objectStorage';

switch (import.meta.env.MODE) {
  case 'development':
  case 'test':
    useRegionsDevelopment();
    break;

  case 'production':
    useRegionsProduction();
    break;

  case 'staging':
    useRegionsStaging();
    break;

  default:
    throw new Error('unknown MODE');
}
