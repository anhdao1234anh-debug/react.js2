export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (params) => [...userKeys.lists(), params],
  detail: (id) => [...userKeys.all, 'detail', id],
};
