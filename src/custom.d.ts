declare module "*.png" {
  const value: string;
  export default value;
}
declare module "i18next" {
  interface CustomTypeOptions {
    returnNull: false;
  }
}
