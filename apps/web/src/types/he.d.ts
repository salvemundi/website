declare module 'he' {
  const he: {
    decode(input: string): string;
    encode(input: string): string;
    [key: string]: any;
  };
  export default he;
}
declare module 'he';
