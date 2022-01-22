import { useRegionsDevelopment } from '$shared/objectStorage';

switch (import.meta.env.MODE) {
  case 'development':
    useRegionsDevelopment();
    break;

  default:
    throw new Error('unknown MODE');
}
