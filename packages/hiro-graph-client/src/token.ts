export interface TokenOptions {
  //
}

export class Token {
  private value: string;
  private options: TokenOptions = {};

  constructor(value?: string, options?: TokenOptions) {
    if (options) {
      this.options = options;
    }

    this.value = value || '';
  }

  get() {
    return this.value;
  }
}
