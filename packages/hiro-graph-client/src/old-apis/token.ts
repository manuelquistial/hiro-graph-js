class _Token {
  private static value: string = '';

  set(token: string) {
    _Token.value = token;
  }

  get() {
    return _Token.value;
  }
}

export const Token = new _Token();

export default Token;
