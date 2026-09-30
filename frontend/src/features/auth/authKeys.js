// Query key factory: gom key của feature vào 1 chỗ -> invalidate chính xác, không gõ nhầm.
export const authKeys = {
  all: ['auth'],
  session: () => [...authKeys.all, 'session'],
  providers: () => [...authKeys.all, 'providers'],
  sessions: () => [...authKeys.all, 'sessions'],
};
