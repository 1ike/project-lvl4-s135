export default async function (ctx, page, limit, buttonsMargin = 2) {
  const res = await this.findAndCountAll({
    // where: ...,
    limit,
    offset: (page - 1) * limit,
  });

  const maxPage = Math.ceil(res.count / limit) || 1;

  if (page !== 1 && !res.rows.length) {
    console.log('maxPage = ', maxPage);
    ctx.redirect(`${ctx.path}?page=${maxPage}`);
  }

  if (maxPage === 1) {
    res.pagination = [];
    return res;
  }

  const makePagination = (count = 1, acc = []) => {
    if (count > maxPage) return acc;

    const button = {};

    const needLeftSpaceButton = count === 2 && count < page - buttonsMargin;
    const needRightSpaceButton = count === page + buttonsMargin + 1 && count < maxPage;
    if (needLeftSpaceButton || needRightSpaceButton) {
      button.value = '...';
      button.disabled = true;
      const newCount = needLeftSpaceButton ? page - buttonsMargin : maxPage;
      return makePagination(newCount, [...acc, button]);
    }

    button.value = count;
    button.link = count === 1 ? ctx.path : `${ctx.path}?page=${count}`;
    button.active = count === page;

    return makePagination(count + 1, [...acc, button]);
  };

  const addLeftControl = (pagination) => {
    const button = {};

    const isFirstPage = page === 1;

    button.value = 'prev';
    button.link = isFirstPage ? ctx.path : `${ctx.path}?page=${page - 1}`;
    button.disabled = isFirstPage;

    return [button, ...pagination];
  };

  const addRightControl = (pagination) => {
    const button = {};

    const isLastPage = page === maxPage;

    button.value = 'next';
    button.link = isLastPage ? ctx.path : `${ctx.path}?page=${page + 1}`;
    button.disabled = isLastPage;

    return [...pagination, button];
  };

  const addControlsToPagination = pagination => addLeftControl(addRightControl(pagination));

  const pagination = makePagination();
  res.pagination = addControlsToPagination(pagination);

  return res;
};
