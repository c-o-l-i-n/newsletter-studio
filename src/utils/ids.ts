let counter = 0;
export const newId = (prefix = "b"): string =>
  `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;
