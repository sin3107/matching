function findKey(o, k) {
  if (o.hasOwnProperty) {
    return o.hasOwnProperty(k);
  }
  return false;
}

function hasK(o, ...k) {
  let res = true;
  if (k.length < 1) {
    return true;
  }

  if (k.length < 2) {
    return findKey(o, k[0]);
  }

  if (!o.hasOwnProperty) {
    res = false;
    return res;
  }

  for (let i = 0, e = k.length; i < e; i++) {
    if (this.hasK(o, k[i])) {
      continue;
    }

    res = false;
    break;
  }

  return res;
}

function isEmpty(s) {
  if (s.trim() === "") {
    return true;
  }

  return false;
}

function typeValid(model, key, value) {
  if (model.type === "str") {
    if (typeof value !== "string") {
      throw new Error(`type error: ${key} is not allowed empty`);
    }

    if (isEmpty(value)) {
      if (!model.null) {
        throw new Error(`type error: ${key} is not allowed empty`);
      }
    }

    if (model.max && value.length >= model.max) {
      throw new Error(`${key} is greater than or equals ${model.max}`);
    }

    if (model.min && value.length < model.min) {
      throw new Error(`${key} is less than ${model.min}`);
    }
  }

  if (model.type === "num") {
    if (typeof value === "string") {
      value = parseInt(value);
    }

    if (isNaN(value)) {
      throw new Error(`type error: ${key} is not num`);
    }

    if (model.max && value >= model.max) {
      throw new Error(`${key} is greater than or equals ${model.max}`);
    }

    if (model.min && value < model.min) {
      throw new Error(`${key} is less than ${model.min}`);
    }
  }

  if (model.type === "arr") {
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch (e) {
        throw new Error(`type error: ${key} is not array`);
      }
    }

    if (value instanceof Array === false) {
      throw new Error(`type error: ${key} is not array`);
    }

    if (model.max && value.length >= model.max) {
      throw new Error(
        `type error: ${key} array size error, greater than or equals  ${model.max} count`
      );
    }

    if (model.min && value.length < model.min) {
      throw new Error(
        `type error: ${key} array size error, less than ${model.min} count`
      );
    }

    // 배열 여기서 동일 타입 체크 가능
  }

  if (model.type === "bool") {
    if (typeof value === "string") {
      try {
        value = value.toLowerCase === "true";
      } catch (e) {
        throw new Error(`type error: ${key} is not boolean`);
      }
    }

    if (typeof value !== "boolean") {
      throw new Error(`type error: ${key} is not array`);
    }
  }

  if (model.type === "obj") {
    if (typeof value !== "object")
      throw new Error(`type error: ${key} only object allowed`);
    if (Object.keys(value).length === 0)
      throw new Error(`type error: ${key} is not allowed empty`);
  }

  if (model.type === "date") {
    if (typeof value === "string") {
      value = new Date(value);
    }

    if (isNaN(new Date(value)))
      throw new Error(`type error: ${key} only date is allowed`);
  }

  return value;
}

function valid(body, models) {
  let data = {};
  for (let i = 0; i < Object.keys(models).length; i++) {
    let key = Object.keys(models)[i];
    let value = body[key];
    let model = models[key];

    if (!hasK(body, key)) {
      if (models[key].optional) {
        continue;
      } else {
        throw new Error(`not found key ${key}`);
      }
    }

    value = typeValid(model, key, value);

    data[key] = value;
  }

  return data;
}

function validArrayObject(body, models) {
  for (let i = 0, e = body.length; i < e; i++) {
    let item = body[i];
    let data = {};
    for (let i = 0; i < Object.keys(models).length; i++) {
      let key = Object.keys(models)[i];
      let value = item[key];
      let model = models[key];

      if (!hasK(item, key)) {
        if (models[key].optional) {
          continue;
        } else {
          throw new Error(`not found key ${key}`);
        }
      }

      value = typeValid(model, key, value);
      data[key] = value;
    }
    body[i] = data;
  }
  return body;
}

function validObject(body, models) {
  for (let i = 0, e = Object.keys(body).length; i < e; i++) {
    let item = body[Object.keys(body)[i]];
    let data = {};
    for (let i = 0; i < Object.keys(models).length; i++) {
      let key = Object.keys(models)[i];
      let value = item[key];
      let model = models[key];

      if (!hasK(item, key)) {
        if (models[key].optional) {
          continue;
        } else {
          throw new Error(`not found key ${key}`);
        }
      }

      value = typeValid(model, key, value);
      data[key] = value;
    }
    body[Object.keys(body)[i]] = data;
  }
  return body;
}

export { valid, validArrayObject, validObject, hasK };
