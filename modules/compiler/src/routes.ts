import wrap from '@pasta/helper-internal/lib/wrap';

import compiler from './compiler';

export default app => {
  app.post('/compile', wrap(async (req, res) => {
    const { source } = req.body;
    const result = await compiler.compile(source);

    // Save script
    res.send(result);
  }));
};
