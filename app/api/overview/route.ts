import { route, STAFF } from '@/lib/api';
import { overview } from '@/lib/service';
export const GET = route(STAFF, async ({ user, req }) => overview(user.clinicId!, req.nextUrl.searchParams.get('date') ?? undefined));
