import { ENC_SECRET_KEY } from "../graphql/const.js";

// xor
export const decrypt = (input) => {
  let result = "";

  for (let i = 0; i < input.length; i++) {
    const xorChar = String.fromCharCode(
      input.charCodeAt(i) ^ ENC_SECRET_KEY.charCodeAt(i)
    );
    result += xorChar;
  }

  return result;
};
