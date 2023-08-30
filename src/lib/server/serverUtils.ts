export const makeEmitData = <T extends Record<string | number | symbol, unknown>>(data: T) => {
  return JSON.stringify(data);
};
