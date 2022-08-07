import { block_use_case } from "../use-cases/handle-block.js";

// ANCHOR status code list
const ok = "200";
const created = "201";
const badRequest = "400";
const unauthorized = "401";
const serverError = "500";
const httpResponse = {
  headers: "",
  statusCode: "",
  body: "",
};
export { postBlock, postUnblock, getBlockList };

async function postBlock(httpRequest) {
  try {
    const {
      body: { blocks },
    } = httpRequest;
    const { status, body } = await block_use_case.addBlock(blocks);
    httpResponse.statusCode = status ? created : badRequest;
    httpResponse.body = body;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
async function postUnblock(httpRequest) {
  try {
    const {
      body: { blocks },
    } = httpRequest;
    const { status, body } = await block_use_case.unblock(blocks);
    httpResponse.statusCode = status ? ok : badRequest;
    httpResponse.body = body;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
async function getBlockList(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
      },
      query: { type, pagination },
    } = httpRequest;
    const { status, body } = await block_use_case.getBlockList(
      _id,
      type,
      pagination
    );
    httpResponse.statusCode = status ? ok : badRequest;
    httpResponse.body = body;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
