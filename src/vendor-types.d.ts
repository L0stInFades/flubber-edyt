declare module "svgpath" {
  const svgpath: (path: string) => {
    abs: () => any;
  };
  export default svgpath;
}
