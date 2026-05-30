// Node/Bun expose `import.meta.filename` / `.dirname`; declare them for tsc.
interface ImportMeta {
  readonly filename: string;
  readonly dirname: string;
}
