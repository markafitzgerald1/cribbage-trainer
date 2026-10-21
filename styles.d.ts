declare module "*.css";

declare module "virtual:expected-table-identity" {
  const identity: import("./src/game/tableIdentity").TableIdentity;
  export default identity;
}
