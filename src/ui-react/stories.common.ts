export const createArgTypes = (property: string, labels: string[]) => ({
  [property]: {
    control: {
      labels,
      type: "select",
    },
  },
});
