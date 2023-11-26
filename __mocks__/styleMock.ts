module.exports = new Proxy(
  {},
  {
    get: (_target, prop) => {
      if (prop === "__esModule") return true;
      return `mock-${String(prop)}`;
    },
  },
);
