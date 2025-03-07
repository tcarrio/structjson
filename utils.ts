/**
 * Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Utilities for converting between JSON and goog.protobuf.Struct
 * proto.
 */

export function jsonToStructProto(json: any): any {
  const fields: any = {};
  for (const k of Object.keys(json)) {
    if (json[k] === undefined) {
      continue;
    }
    fields[k] = jsonValueToProto(json[k]);
  }

  return { fields };
}

const JSON_SIMPLE_TYPE_TO_PROTO_KIND_MAP = {
  [typeof 0]: "numberValue",
  [typeof ""]: "stringValue",
  [typeof false]: "boolValue",
};

const JSON_SIMPLE_VALUE_KINDS = new Set([
  "numberValue",
  "stringValue",
  "boolValue",
]);

function jsonValueToProto(value: any) {
  const valueProto: any = {};

  if (value === null) {
    valueProto.kind = "nullValue";
    valueProto.nullValue = "NULL_VALUE";
  } else if (value instanceof Array) {
    valueProto.kind = "listValue";
    valueProto.listValue = { values: value.map(jsonValueToProto) };
  } else if (typeof value === "object") {
    valueProto.kind = "structValue";
    valueProto.structValue = jsonToStructProto(value);
  } else if (typeof value in JSON_SIMPLE_TYPE_TO_PROTO_KIND_MAP) {
    const kind = JSON_SIMPLE_TYPE_TO_PROTO_KIND_MAP[typeof value];
    valueProto.kind = kind;
    valueProto[kind] = value;
  } else {
    // tslint:disable-next-line
    console.warn("Unsupported value type ", typeof value);
  }
  return valueProto;
}

export function structProtoToJson(proto: any) {
  if (!proto || !proto.fields) {
    return {};
  }
  const json: any = {};
  for (const k of Object.keys(proto.fields)) {
    json[k] = valueProtoToJson(proto.fields[k]);
  }
  return json;
}

function valueProtoToJson(proto: any) {
  if (!proto || !proto.kind) {
    return null;
  }

  if (JSON_SIMPLE_VALUE_KINDS.has(proto.kind)) {
    return proto[proto.kind];
  } else if (proto.kind === "nullValue") {
    return null;
  } else if (proto.kind === "listValue") {
    if (!proto.listValue || !proto.listValue.values) {
      // tslint:disable-next-line
      console.warn("Invalid JSON list value proto: ", JSON.stringify(proto));
    }
    return proto.listValue.values.map(valueProtoToJson);
  } else if (proto.kind === "structValue") {
    return structProtoToJson(proto.structValue);
  } else {
    // tslint:disable-next-line
    console.warn("Unsupported JSON value proto kind: ", proto.kind);
    return null;
  }
}
