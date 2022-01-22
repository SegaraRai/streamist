import { useRegionsDevelopment } from '$shared/objectStorage';

switch (import.meta.env.MODE) {
  case 'development':
  case 'test':
    useRegionsDevelopment();
    break;

  default:
    throw new Error('unknown MODE');
}
