/**
 * 可到访地点过滤的针对性测试（COLLABORATION.md C02）。用的是河内实际返回过的条目。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { isVisitable } from "../lib/places/visitable";

const wp = (title: string, description?: string, extra: { coordType?: string; coordDim?: number } = {}) => ({ source: "wikipedia" as const, title, description, ...extra });

test("国家、事件、机构、团体、行政区不算可到访地点", () => {
  assert.equal(isVisitable(wp("North Vietnam", "Country in Southeast Asia (1945–1976)")), false);
  assert.equal(isVisitable(wp("Siege of Songping", "9th-century siege battle in Southeast Asia")), false);
  assert.equal(isVisitable(wp("International Control Commission", "1954–1974 United Nations mission in Vietnam, Laos, and Cambodia")), false);
  assert.equal(isVisitable(wp("Battle of Hanoi (1946)", "First battle in the First Indochina War")), false);
  assert.equal(isVisitable(wp("Hoàn Kiếm district", "Urban district in Hanoi, Vietnam")), false);
  assert.equal(isVisitable(wp("Red River Delta", "River delta in Vietnam")), false);
  assert.equal(isVisitable(wp("Alcatraz Gang", "Group of US prisoners of war in Vietnam")), false);
  assert.equal(isVisitable(wp("State Bank of Vietnam", "Central Bank of Vietnam")), false);
  assert.equal(isVisitable(wp("Hanoi Stock Exchange", "Stock exchange in Hanoi, Vietnam")), false);
  assert.equal(isVisitable(wp("Archdiocese of Hanoi", "Archdiocese of the Catholic Church in Vietnam")), false);
  assert.equal(isVisitable(wp("Vietnam – Germany Hospital", "Hospital in Hanoi, Vietnam")), false);
  assert.equal(isVisitable(wp("Trưng Vương Junior Secondary School", "Public junior secondary school in Hanoi, Vietnam")), false);
});

test("实体建筑、场所和街道保留，即使描述里带机构词", () => {
  assert.equal(isVisitable(wp("Turtle Tower", "Historic structure in Hanoi, Vietnam")), true);
  assert.equal(isVisitable(wp("Hoàn Kiếm Lake", "Lake in Hanoi, Vietnam")), true);
  assert.equal(isVisitable(wp("Ngọc Sơn Temple", "Temple in Vietnam")), true);
  assert.equal(isVisitable(wp("Hanoi Opera House", "Opera house, theater in Hanoi, Vietnam")), true);
  assert.equal(isVisitable(wp("National Library of Vietnam", "National library (est. 1917)")), true);
  assert.equal(isVisitable(wp("Hàng Bông Street", "Street in Hanoi, Vietnam")), true);
  assert.equal(isVisitable(wp("Hỏa Lò Prison", "Vietnamese Prison Camp")), true, "监狱遗址是可参观的博物馆，prison camp 不该被 camp 误杀");
  assert.equal(isVisitable(wp("Museum of the University", "University museum in Hanoi")), true);
  assert.equal(isVisitable(wp("Eiffel Tower", "Tower in Paris, France")), true);
});

test("没有描述时保留，交给后面的信号判断", () => {
  assert.equal(isVisitable(wp("Đại La")), true);
});

test("Wikipedia 坐标的 type / dim 说明是区域或事件时排除", () => {
  assert.equal(isVisitable(wp("Hanoi", "Capital of Vietnam", { coordType: "city" })), false);
  assert.equal(isVisitable(wp("Red River Delta", undefined, { coordType: "adm1st", coordDim: 100000 })), false);
  assert.equal(isVisitable(wp("Hoàn Kiếm Lake", "Lake in Hanoi, Vietnam", { coordType: "waterbody", coordDim: 10000 })), true, "waterbody 的默认 dim 是 10000，不能当区域排除");
  assert.equal(isVisitable(wp("Some school", undefined, { coordType: "edu" })), false);
  assert.equal(isVisitable(wp("Some landmark", undefined, { coordType: "landmark", coordDim: 200 })), true);
});
