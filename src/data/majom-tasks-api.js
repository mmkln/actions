export function createMajomTasksApi({ request }) {
  return Object.freeze({
    search({ search = '', status = '', page = 1 } = {}) {
      const query = new URLSearchParams({ page: String(page) });
      if (search) query.set('search', search);
      if (status) query.set('status', status);
      return request(`/sources/majom/tasks/?${query}`);
    },

    resolve(taskUuids) {
      if (!taskUuids.length) {
        return Promise.resolve({
          count: 0,
          next: null,
          previous: null,
          results: [],
        });
      }
      const query = new URLSearchParams({ uuids: taskUuids.join(',') });
      return request(`/sources/majom/tasks/?${query}`);
    },

    update(taskUuid, changes) {
      return request(`/sources/majom/tasks/${taskUuid}/`, {
        method: 'PATCH',
        body: JSON.stringify(changes),
      });
    },
  });
}
