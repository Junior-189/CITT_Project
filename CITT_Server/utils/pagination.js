function getPaginationParams(query) {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function formatPaginatedResponse(items, itemsKey, page, limit, total) {
  return {
    [itemsKey]: items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  getPaginationParams,
  formatPaginatedResponse,
};
